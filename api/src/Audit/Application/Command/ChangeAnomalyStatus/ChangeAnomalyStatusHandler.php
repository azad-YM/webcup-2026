<?php

declare(strict_types=1);

namespace Audit\Application\Command\ChangeAnomalyStatus;

use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Ports\Provider\AuditActorProvider;
use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Application\Service\AnomalyView;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F85 : changement de statut d'une anomalie, journalisé (`audit.anomaly.status_changed`). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeAnomalyStatusHandler
{
    public function __construct(
        private AnomalyRepository $anomalies,
        private AuditAccessPolicy $access,
        private AuditActorProvider $actors,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ChangeAnomalyStatusCommand $command): array
    {
        if (!$this->access->canReadSecurityEntries()) {
            throw new AccessDeniedException('Le suivi des anomalies exige la permission admin.security.read.');
        }
        $anomaly = $this->anomalies->find($command->id) ?? throw new NotFoundException('Anomalie introuvable.');
        $previous = $anomaly->status();
        $anomaly->changeStatus($command->status, $this->actors->current()?->label ?? 'Agent', $this->clock->now());
        $this->anomalies->save($anomaly);
        if ($previous !== $command->status) {
            $this->audit?->record(
                'audit.anomaly.status_changed',
                'anomaly',
                $anomaly->id,
                sprintf('Anomalie « %s » : %s → %s.', $anomaly->title(), AnomalyView::STATUS_LABELS[$previous], AnomalyView::STATUS_LABELS[$command->status]),
                ['rule' => $anomaly->rule, 'from' => $previous, 'to' => $command->status],
            );
        }

        return AnomalyView::of($anomaly);
    }
}
