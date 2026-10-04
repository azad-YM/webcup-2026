<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListPublicRequests;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\PublicRequestView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListPublicRequestsHandler
{
    public const LIMIT = 50;

    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestSupportRepository $supports,
    ) {}

    /** @return array{items: list<PublicRequestView>} */
    public function __invoke(ListPublicRequestsQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $requests = $this->requests->findPublic(self::LIMIT);
        $ids = array_map(fn ($request) => $request->id, $requests);
        $counts = $this->supports->countByRequests($ids);
        $mine = array_flip($this->supports->supportedBy($citizen->id, $ids));

        return ['items' => array_map(
            fn ($request) => PublicRequestView::from($request, $counts[$request->id] ?? 0, isset($mine[$request->id]), $citizen->id),
            $requests,
        )];
    }
}
