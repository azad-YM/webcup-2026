<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Repository;

use Participation\Domain\Entity\Project;

interface ProjectRepository
{
    public function save(Project $project): void;

    public function find(string $id): ?Project;

    /** @return list<Project> */
    public function all(): array;
}
