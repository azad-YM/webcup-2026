<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\KnownDeviceRepository;
use IAM\Domain\Entity\KnownDevice;
use Symfony\Component\Messenger\MessageBusInterface;

/** Appareils reconnus (F54) : sans flush, événements publiés sur `event.bus`. */
final readonly class DoctrineKnownDeviceRepository implements KnownDeviceRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(KnownDevice $device): void
    {
        $this->manager->persist($device);
        foreach ($device->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function remove(KnownDevice $device): void { $this->manager->remove($device); }

    public function find(string $id): ?KnownDevice { return $this->manager->find(KnownDevice::class, $id); }

    public function findByHash(string $userId, string $deviceHash): ?KnownDevice
    {
        return $this->manager->getRepository(KnownDevice::class)->findOneBy(['userId' => $userId, 'deviceHash' => $deviceHash]);
    }

    public function findByUser(string $userId): array
    {
        return array_values($this->manager->getRepository(KnownDevice::class)->findBy(['userId' => $userId], ['lastUsedAt' => 'DESC']));
    }

    public function countByUser(string $userId): int
    {
        return $this->manager->getRepository(KnownDevice::class)->count(['userId' => $userId]);
    }

    public function eraseAccount(string $userId): void
    {
        $db = $this->manager->getConnection();
        foreach (['iam_known_devices', 'iam_sign_ins', 'iam_login_links', 'iam_verification_challenges'] as $table) {
            $db->executeStatement(sprintf('DELETE FROM %s WHERE user_id = ?', $table), [$userId]);
        }
    }
}
