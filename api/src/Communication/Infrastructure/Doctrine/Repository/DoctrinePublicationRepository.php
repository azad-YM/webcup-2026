<?php

declare(strict_types=1);

namespace Communication\Infrastructure\Doctrine\Repository;

use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Domain\Entity\Publication;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/** No flush here: `command.bus` owns the transaction; domain events go to `event.bus`. */
final readonly class DoctrinePublicationRepository implements PublicationRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(Publication $item): void
    {
        $this->manager->persist($item);
        foreach ($item->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function find(string $id): ?Publication
    {
        return $this->manager->find(Publication::class, $id);
    }

    public function all(): array
    {
        return $this->manager->getRepository(Publication::class)->findAll();
    }
}
