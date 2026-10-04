<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Repository;

use Participation\Domain\Entity\ServiceReview;

/** F76 : avis sur les services. Sauvegarde sans `flush()` (transaction du `command.bus`). */
interface ServiceReviewRepository
{
    public function save(ServiceReview $review): void;

    public function find(string $id): ?ServiceReview;

    public function findForPeriod(string $citizenId, string $serviceId, string $period): ?ServiceReview;

    /** @return list<ServiceReview> */
    public function findByCitizen(string $citizenId): array;

    /** @return list<ServiceReview> les plus récents d'abord */
    public function findQueue(?string $status, ?string $serviceId, int $limit): array;

    /** @return array<string, array{average: float, count: int}> par identifiant de service */
    public function ratings(?string $serviceId = null): array;

    public function eraseByCitizen(string $citizenId): void;
}
