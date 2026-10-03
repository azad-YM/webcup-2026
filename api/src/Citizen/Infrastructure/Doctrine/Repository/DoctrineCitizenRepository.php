<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/** Pas de flush : le middleware doctrine_transaction du command.bus le porte. */
final readonly class DoctrineCitizenRepository implements CitizenRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(Citizen $citizen): void
    {
        $this->manager->persist($citizen);
        foreach ($citizen->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function findByUserId(string $userId): ?Citizen
    {
        return $this->manager->getRepository(Citizen::class)->findOneBy(['userId' => $userId]);
    }
}
