<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListProjects;

use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Project;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListProjectsHandler
{
    public function __construct(private ProjectRepository $projects) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListProjectsQuery $query): array
    {
        $district = $query->district === null || $query->district === '' ? null : $query->district;
        $status = $query->status === null || $query->status === '' ? null : $query->status;
        $items = array_values(array_filter(
            $this->projects->all(),
            static fn (Project $project): bool => $project->isPublished()
                && ($district === null || ($district === 'city' ? $project->district() === null : $project->district() === $district))
                && ($status === null || $project->status() === $status),
        ));
        $views = array_map(static fn (Project $project): array => $project->publicView(), $items);
        usort($views, static fn (array $a, array $b): int => $b['updatedAt'] <=> $a['updatedAt']);

        return ['items' => $views];
    }
}
