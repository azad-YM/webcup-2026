<?php

declare(strict_types=1);

namespace Citizen\Application\Command\MarkEmergencyHandled;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class MarkEmergencyHandledHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    public function __invoke(MarkEmergencyHandledCommand $cmd): ServiceRequestView
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Taking an emergency in charge requires the admin.request.write permission.');
        }
        $request = $this->requests->findById($cmd->requestId) ?? throw new NotFoundException('Request not found.');
        $request->markEmergencyHandled($this->identity->userId(), $this->clock->now());
        $this->requests->save($request);
        $this->audit?->record(
            'citizen.request.emergency_handled',
            'service-request',
            $request->id,
            sprintf('Urgence médicale %s prise en charge.', $request->reference),
            ['reference' => $request->reference, 'at' => $request->emergencyHandledAt()?->format(\DateTimeInterface::ATOM)],
        );

        return ServiceRequestView::fromRequest($request);
    }
}
