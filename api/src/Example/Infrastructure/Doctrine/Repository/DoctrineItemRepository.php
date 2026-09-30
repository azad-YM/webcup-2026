<?php

declare(strict_types=1);

namespace Example\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Example\Application\Ports\Repository\ItemRepository;
use Example\Domain\Entity\Item;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\MessageBusInterface;

/** No flush here: the doctrine_transaction middleware of command.bus owns it. */
final readonly class DoctrineItemRepository implements ItemRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function findOrFail(string $id): Item
    {
        return $this->manager->find(Item::class, $id) ?? throw new NotFoundException('Item not found.');
    }

    public function findAll(): array
    {
        return $this->manager->getRepository(Item::class)->findBy([], ['name' => 'ASC']);
    }

    public function save(Item $item): void
    {
        $this->manager->persist($item);
        foreach ($item->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function delete(Item $item): void
    {
        $this->manager->remove($item);
    }

    public function nameExists(string $name, ?string $ignoredId = null): bool
    {
        $qb = $this->manager->createQueryBuilder()
            ->select('COUNT(i.id)')
            ->from(Item::class, 'i')
            ->where('LOWER(i.name) = :name')
            ->setParameter('name', mb_strtolower(trim($name)));
        if ($ignoredId !== null) {
            $qb->andWhere('i.id <> :ignoredId')->setParameter('ignoredId', $ignoredId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }
}
