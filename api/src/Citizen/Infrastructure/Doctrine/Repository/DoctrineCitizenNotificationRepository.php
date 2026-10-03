<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Application\Ports\Service\AccountDataEraser;
use Citizen\Domain\Entity\CitizenNotification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineCitizenNotificationRepository implements CitizenNotificationRepository, AccountDataEraser
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(CitizenNotification $notification): void
    {
        $this->manager->persist($notification);
        foreach ($notification->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function existsForSource(string $citizenId, string $sourceKey): bool
    {
        return $this->manager->getRepository(CitizenNotification::class)->count(['citizenId' => $citizenId, 'sourceKey' => $sourceKey]) > 0;
    }

    public function findByCitizen(string $citizenId, int $limit): array
    {
        return array_values($this->manager->getRepository(CitizenNotification::class)
            ->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC', 'id' => 'DESC'], $limit));
    }

    public function countUnread(string $citizenId): int
    {
        return $this->manager->getRepository(CitizenNotification::class)->count(['citizenId' => $citizenId, 'readAt' => null]);
    }

    public function findUnread(string $citizenId, ?array $ids): array
    {
        $criteria = ['citizenId' => $citizenId, 'readAt' => null];
        if ($ids !== null) {
            $criteria['id'] = $ids;
        }

        return array_values($this->manager->getRepository(CitizenNotification::class)->findBy($criteria));
    }

    /** Suppression du compte : les notifications du citoyen sont effacées dans la même transaction. */
    public function erase(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(CitizenNotification::class, 'n')
            ->where('n.citizenId = :citizen')
            ->setParameter('citizen', $citizenId)
            ->getQuery()
            ->execute();
    }
}
