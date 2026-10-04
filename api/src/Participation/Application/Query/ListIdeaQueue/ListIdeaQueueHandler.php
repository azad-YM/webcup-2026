<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListIdeaQueue;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Domain\Entity\Idea;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Ideas to follow (oldest first, 300 at most), hidden ones included, without the author. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListIdeaQueueHandler
{
    public function __construct(private IdeaRepository $ideas, private ParticipationAccessPolicy $access) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListIdeaQueueQuery $query): array
    {
        if (!$this->access->canRead()) {
            throw new AccessDeniedException('Permission admin.participation.read requise.');
        }
        $status = $query->status !== null && in_array($query->status, Idea::STATUSES, true) ? $query->status : null;

        return ['items' => array_map(static fn (Idea $idea): array => $idea->followUpView(), $this->ideas->findQueue($status, 300))];
    }
}
