<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Repository;

use Participation\Domain\Entity\Idea;

interface IdeaRepository
{
    public function save(Idea $idea): void;

    public function find(string $id): ?Idea;

    /** @return list<Idea> most recent first */
    public function findPublic(int $limit): array;

    /** @return list<Idea> most recent first */
    public function findByCitizen(string $citizenId): array;

    /** @return list<Idea> oldest first (queue of the agents) */
    public function findQueue(?string $status, int $limit): array;

    /** Account deletion: every idea of the citizen is erased. */
    public function eraseByCitizen(string $citizenId): void;
}
