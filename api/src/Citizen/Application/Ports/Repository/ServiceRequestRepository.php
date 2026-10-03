<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\ServiceRequest;

interface ServiceRequestRepository
{
    /** Persiste sans flush (transaction du command.bus) et publie les événements de l'agrégat. */
    public function save(ServiceRequest $request): void;

    public function findById(string $id): ?ServiceRequest;

    public function findByReference(string $reference): ?ServiceRequest;

    /** @return list<ServiceRequest> les plus récentes d'abord */
    public function findByCitizen(string $citizenId): array;

    /** @return list<ServiceRequest> les plus anciennes d'abord (ordre de traitement) */
    public function findQueue(?string $status, int $offset, int $limit): array;

    public function countByStatus(?string $status): int;
}
