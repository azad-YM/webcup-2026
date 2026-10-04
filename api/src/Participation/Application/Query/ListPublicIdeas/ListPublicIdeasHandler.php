<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListPublicIdeas;

use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Domain\Entity\Idea;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Public ideas (the 200 most recent), without their author. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListPublicIdeasHandler
{
    public function __construct(private IdeaRepository $ideas) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListPublicIdeasQuery $query): array
    {
        $status = $query->status === null || $query->status === '' ? null : $query->status;
        $items = array_filter($this->ideas->findPublic(200), static fn (Idea $idea): bool => $status === null || $idea->status() === $status);

        return ['items' => array_values(array_map(static fn (Idea $idea): array => $idea->publicView(), $items))];
    }
}
