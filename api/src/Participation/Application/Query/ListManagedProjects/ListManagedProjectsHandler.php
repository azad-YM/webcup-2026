<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListManagedProjects;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Project;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Every project, drafts and withdrawn ones included (most recently updated first). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListManagedProjectsHandler
{
    public function __construct(private ProjectRepository $projects, private ParticipationAccessPolicy $access) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListManagedProjectsQuery $query): array
    {
        if (!$this->access->canRead()) {
            throw new AccessDeniedException('Permission admin.participation.read requise.');
        }
        $views = array_map(static fn (Project $project): array => $project->managementView(), $this->projects->all());
        usort($views, static fn (array $a, array $b): int => $b['updatedAt'] <=> $a['updatedAt']);

        return $views;
    }
}
