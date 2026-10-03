<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyServiceRequest;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyServiceRequestHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestSupportRepository $supports,
    ) {}

    /** La demande d'un autre citoyen répond 404, comme une référence inconnue. */
    public function __invoke(GetMyServiceRequestQuery $query): ServiceRequestView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $request = $this->requests->findByReference(strtoupper(trim($query->reference)));
        if ($request === null || $request->citizenId !== $citizen->id) {
            throw new NotFoundException('Request not found.');
        }

        return ServiceRequestView::fromRequest($request, $this->supports->countByRequests([$request->id])[$request->id] ?? 0);
    }
}
