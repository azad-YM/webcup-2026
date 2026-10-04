<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\Concern;

interface ConcernRepository
{
    /** Persiste sans flush et publie les événements de l'agrégat. */
    public function save(Concern $concern): void;

    public function find(string $id): ?Concern;

    /** @return list<Concern> les plus récentes d'abord */
    public function findByCitizen(string $citizenId): array;

    /** @return list<Concern> les plus anciennes d'abord (ordre de traitement) */
    public function findQueue(?string $status, int $limit): array;

    public function countByStatus(string $status): int;
}
