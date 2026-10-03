<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\CitizenNotification;

interface CitizenNotificationRepository
{
    /** Persiste sans flush (transaction du command.bus) et publie les événements de l'agrégat. */
    public function save(CitizenNotification $notification): void;

    public function existsForSource(string $citizenId, string $sourceKey): bool;

    /** @return list<CitizenNotification> les plus récentes d'abord */
    public function findByCitizen(string $citizenId, int $limit): array;

    public function countUnread(string $citizenId): int;

    /**
     * @param list<string>|null $ids null : toutes les notifications non lues du citoyen
     *
     * @return list<CitizenNotification>
     */
    public function findUnread(string $citizenId, ?array $ids): array;
}
