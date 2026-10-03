<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\Ports\Service\AccountDataEraser;
use Citizen\Domain\Entity\Concern;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineConcernRepository implements ConcernRepository, AccountDataEraser
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(Concern $concern): void
    {
        $this->manager->persist($concern);
        foreach ($concern->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function find(string $id): ?Concern
    {
        return $this->manager->find(Concern::class, $id);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(Concern::class)->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC']));
    }

    public function findQueue(?string $status, int $limit): array
    {
        return array_values($this->manager->getRepository(Concern::class)
            ->findBy($status === null ? [] : ['status' => $status], ['createdAt' => 'ASC'], $limit));
    }

    public function countByStatus(string $status): int
    {
        return $this->manager->getRepository(Concern::class)->count(['status' => $status]);
    }

    /** Suppression du compte : les inquiétudes du citoyen sont effacées. */
    public function erase(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(Concern::class, 'c')->where('c.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
