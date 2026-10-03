<?php

declare(strict_types=1);

namespace Communication\Infrastructure\Doctrine\Repository;

use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Domain\Entity\Alert;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/** No flush here: `command.bus` owns the transaction; domain events go to `event.bus`. */
final readonly class DoctrineAlertRepository implements AlertRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(Alert $item): void
    {
        $this->manager->persist($item);
        foreach ($item->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function find(string $id): ?Alert
    {
        return $this->manager->find(Alert::class, $id);
    }

    public function all(): array
    {
        return $this->manager->getRepository(Alert::class)->findAll();
    }
}
