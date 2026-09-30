<?php

declare(strict_types=1);

namespace Tests\Example\Doubles\Repository;

use Example\Application\Ports\Repository\ItemRepository;
use Example\Domain\Entity\Item;
use Shared\Domain\Event\DomainEvent;
use Shared\Domain\Exception\NotFoundException;

final class RamItemRepository implements ItemRepository
{
    /** @var array<string, Item> */
    private array $items = [];
    /** @var list<DomainEvent> */
    public array $events = [];

    /** @param list<Item> $items */
    public function __construct(array $items = [])
    {
        foreach ($items as $item) {
            $this->items[$item->id()] = $item;
        }
    }

    public function findOrFail(string $id): Item
    {
        return $this->items[$id] ?? throw new NotFoundException('Item not found.');
    }

    public function findAll(): array
    {
        $items = array_values($this->items);
        usort($items, static fn (Item $a, Item $b): int => strcmp($a->name(), $b->name()));

        return $items;
    }

    public function save(Item $item): void
    {
        $this->items[$item->id()] = $item;
        array_push($this->events, ...$item->pullDomainEvents());
    }

    public function delete(Item $item): void
    {
        unset($this->items[$item->id()]);
    }

    public function nameExists(string $name, ?string $ignoredId = null): bool
    {
        foreach ($this->items as $item) {
            if ($item->id() !== $ignoredId && mb_strtolower($item->name()) === mb_strtolower(trim($name))) {
                return true;
            }
        }

        return false;
    }
}
