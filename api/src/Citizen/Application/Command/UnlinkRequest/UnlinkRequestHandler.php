<?php

declare(strict_types=1);

namespace Citizen\Application\Command\UnlinkRequest;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class UnlinkRequestHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array{groupId: ?string, references: list<string>} membres restants du groupe */
    public function __invoke(UnlinkRequestCommand $cmd): array
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Unlinking requests requires the admin.request.write permission.');
        }
        $request = $this->requests->findById($cmd->requestId) ?? throw new NotFoundException('Request not found.');
        $groupId = $request->groupId();
        if ($groupId === null) {
            return ['groupId' => null, 'references' => []];
        }
        $now = $this->clock->now();
        $request->unlinkFromGroup($now);
        $this->requests->save($request);
        $remaining = array_values(array_filter($this->requests->findByGroup($groupId), fn ($member) => $member->id !== $request->id));
        // Un groupe d'une seule demande n'a plus de sens.
        if (count($remaining) === 1) {
            $remaining[0]->unlinkFromGroup($now);
            $this->requests->save($remaining[0]);
            $remaining = [];
        }
        $this->audit?->record(
            'citizen.request.unlinked',
            'service-request-group',
            $groupId,
            sprintf('Demande %s retirée du groupe « même problème ».', $request->reference),
            ['reference' => $request->reference],
        );

        return ['groupId' => $remaining === [] ? null : $groupId, 'references' => array_map(fn ($member) => $member->reference, $remaining)];
    }
}
