<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\RequestSupport;

interface RequestSupportRepository
{
    public function save(RequestSupport $support): void;

    public function remove(RequestSupport $support): void;

    public function find(string $requestId, string $citizenId): ?RequestSupport;

    /** @param list<string> $requestIds @return array<string, int> nombre de soutiens par demande */
    public function countByRequests(array $requestIds): array;

    /** @param list<string> $requestIds @return list<string> demandes soutenues par ce citoyen */
    public function supportedBy(string $citizenId, array $requestIds): array;
}
