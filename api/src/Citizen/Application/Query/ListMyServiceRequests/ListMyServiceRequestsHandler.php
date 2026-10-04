<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyServiceRequests;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyServiceRequestsHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestSupportRepository $supports,
        private ?RequestMessageRepository $messages = null,
    ) {}

    /** @return array{items: list<ServiceRequestView>} */
    public function __invoke(ListMyServiceRequestsQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');

        $requests = $this->requests->findByCitizen($citizen->id);
        $ids = array_map(fn ($request) => $request->id, $requests);
        $counts = $this->supports->countByRequests($ids);
        $messages = $this->messages?->countByRequests($ids) ?? [];

        return ['items' => array_map(fn ($request) => ServiceRequestView::fromRequest($request, $counts[$request->id] ?? 0)
            ->withMessageCount($messages[$request->id] ?? 0)->forCitizen(), $requests)];
    }
}
