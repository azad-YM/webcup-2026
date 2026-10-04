<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListServiceReviews;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ServiceReviewRepository;
use Participation\Domain\Entity\ServiceReview;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListServiceReviewsHandler
{
    public const LIMIT = 200;

    public function __construct(private ServiceReviewRepository $reviews, private ParticipationAccessPolicy $access) {}

    /** @return array{items: list<array<string, mixed>>, ratings: array<string, array{average: float, count: int}>} */
    public function __invoke(ListServiceReviewsQuery $query): array
    {
        if (!$this->access->canRead()) {
            throw new AccessDeniedException('Permission admin.participation.read requise.');
        }
        $status = in_array($query->status, ServiceReview::STATUSES, true) ? $query->status : null;

        return [
            'items' => array_map(static fn (ServiceReview $review): array => $review->followUpView(), $this->reviews->findQueue($status, $query->serviceId, self::LIMIT)),
            'ratings' => $this->reviews->ratings(),
        ];
    }
}
