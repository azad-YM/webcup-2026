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

    /** @return list<ServiceRequest> ordre de traitement (F80) : priorité, puis les plus anciennes d'abord */
    public function findQueue(?string $status, int $offset, int $limit, ?string $priority = null): array;

    public function countByStatus(?string $status, ?string $priority = null): int;

    /** F80 : demandes non closes d'une priorité donnée (compteur des urgents). */
    public function countOpenByPriority(string $priority): int;

    /** @return list<ServiceRequest> F86 : urgences médicales non closes, pas encore prises en charge, les plus anciennes d'abord */
    public function findUnhandledEmergencies(int $limit): array;

    /** @return list<ServiceRequest> F75 : demandes non closes reçues depuis `$since`, les plus récentes d'abord */
    public function findOpenSince(\DateTimeImmutable $since, int $limit): array;

    /** @return list<ServiceRequest> F75 : demandes d'un même groupe, les plus anciennes d'abord */
    public function findByGroup(string $groupId): array;

    /**
     * @param list<string> $ids
     * @return list<ServiceRequest>
     */
    public function findByIds(array $ids): array;

    /** @return list<ServiceRequest> F80 : demandes non closes à priorité automatique (réévaluation périodique) */
    public function findOpenAutoPrioritized(int $limit): array;

    /** @return list<ServiceRequest> signalements publics non clos, les plus récents d'abord (F52) */
    public function findPublic(int $limit): array;
}
