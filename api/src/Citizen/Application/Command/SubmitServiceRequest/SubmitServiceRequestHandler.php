<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SubmitServiceRequest;

use Citizen\Application\Exception\MunicipalServiceUnavailable;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Ports\Service\ServiceRequestReferenceGenerator;
use Citizen\Application\ViewModel\ServiceRequestView;
use Citizen\Domain\Entity\ServiceRequest;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class SubmitServiceRequestHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private ServiceRequestReferenceGenerator $references,
        private IIdProvider $ids,
        private IClock $clock,
        private ?MunicipalServiceDirectory $services = null,
    ) {}

    public function __invoke(SubmitServiceRequestCommand $cmd): ServiceRequestView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        // F63 : un service désactivé par la mairie ne reçoit plus de nouvelle demande (erreur contractuelle 409).
        $serviceId = trim($cmd->serviceId ?? '');
        if ($serviceId !== '' && ($service = $this->services?->find($serviceId)) !== null && $service->disabled) {
            throw MunicipalServiceUnavailable::for($service);
        }
        $now = $this->clock->now();
        $request = ServiceRequest::submit(
            $this->ids->getId(),
            $citizen->id,
            $this->references->next($now),
            $cmd->type,
            $cmd->subject,
            $cmd->description,
            $cmd->location,
            $cmd->serviceId,
            $now,
            $cmd->isPublic,
        );
        $this->requests->save($request);

        return ServiceRequestView::fromRequest($request);
    }
}
