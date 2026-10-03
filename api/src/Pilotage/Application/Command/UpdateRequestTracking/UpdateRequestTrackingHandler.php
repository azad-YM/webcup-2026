<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\UpdateRequestTracking;

use Pilotage\Application\Ports\Provider\CurrentAgentProvider;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Pilotage\Domain\Entity\RequestTracking;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class UpdateRequestTrackingHandler
{
    private const STATUS_LABELS = ['todo' => 'à faire', 'in_progress' => 'en cours', 'done' => 'fait'];

    public function __construct(
        private PilotageAccessPolicy $access,
        private RequestTrackingRepository $trackings,
        private CurrentAgentProvider $agents,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(UpdateRequestTrackingCommand $cmd): array
    {
        if (!$this->access->canEditTracking()) {
            throw new AccessDeniedException('Updating the tracking requires the admin.pilotage.write permission.');
        }
        $existing = $this->trackings->find(trim($cmd->requestCode));
        $previous = $existing?->status();
        $tracking = $existing ?? RequestTracking::start($cmd->requestCode);
        $agent = $this->agents->current();
        $tracking->update($cmd->status, $cmd->links, $cmd->note, $this->clock->now(), $agent->id, $agent->name);
        $this->trackings->save($tracking);
        $this->audit?->record(
            'pilotage.tracking.updated',
            'webcup-request',
            $tracking->requestCode,
            sprintf('Suivi de la demande %s : %s.', $tracking->requestCode, self::STATUS_LABELS[$tracking->status()]),
            ['previousStatus' => $previous, 'status' => $tracking->status(), 'links' => count($cmd->links)],
        );

        return $tracking->view();
    }
}
