<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Project;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineProjectRepository implements ProjectRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(Project $project): void
    {
        $this->manager->persist($project);
    }

    public function find(string $id): ?Project
    {
        return $this->manager->find(Project::class, $id);
    }

    public function all(): array
    {
        return array_values($this->manager->getRepository(Project::class)->findAll());
    }
}
