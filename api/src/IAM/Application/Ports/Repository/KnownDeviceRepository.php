<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\KnownDevice;

/** F54 : appareils reconnus. Persiste sans flush (transaction du command.bus) et publie les événements. */
interface KnownDeviceRepository
{
    public function save(KnownDevice $device): void;
    public function remove(KnownDevice $device): void;
    public function find(string $id): ?KnownDevice;
    public function findByHash(string $userId, string $deviceHash): ?KnownDevice;
    /** @return list<KnownDevice> les plus récemment utilisés d'abord */
    public function findByUser(string $userId): array;
    public function countByUser(string $userId): int;
    /** Suppression du compte : appareils, connexions, liens et codes du compte. */
    public function eraseAccount(string $userId): void;
}
