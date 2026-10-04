<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListServiceRatings;

use Participation\Application\Ports\Repository\ServiceReviewRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListServiceRatingsHandler
{
    public function __construct(private ServiceReviewRepository $reviews) {}

    /** @return array{items: list<array{serviceId: string, average: float, count: int}>} */
    public function __invoke(ListServiceRatingsQuery $query): array
    {
        $items = [];
        foreach ($this->reviews->ratings($query->serviceId) as $serviceId => $rating) {
            $items[] = ['serviceId' => (string) $serviceId, 'average' => $rating['average'], 'count' => $rating['count']];
        }

        return ['items' => $items];
    }
}
