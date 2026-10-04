<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SetRequestPriority;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetRequestPriorityHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    public function __invoke(SetRequestPriorityCommand $cmd): ServiceRequestView
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Changing a priority requires the admin.request.write permission.');
        }
        $request = $this->requests->findById($cmd->requestId) ?? throw new NotFoundException('Request not found.');
        $previous = $request->priority();
        $request->setPriority($cmd->priority, $cmd->reason, $this->clock->now());
        $this->requests->save($request);
        $this->audit?->record(
            'citizen.request.priority_changed',
            'service-request',
            $request->id,
            sprintf('Demande %s : priorité %s → %s.', $request->reference, $previous, $cmd->priority),
            ['reference' => $request->reference, 'from' => $previous, 'to' => $cmd->priority, 'reason' => $request->priorityReason()],
        );

        return ServiceRequestView::fromRequest($request);
    }
}
