<?php

declare(strict_types=1);

namespace Example\Application\Ports\Repository;

use Example\Domain\Entity\Item;
use Shared\Domain\Exception\NotFoundException;

interface ItemRepository
{
    /** @throws NotFoundException */
    public function findOrFail(string $id): Item;

    /** @return list<Item> Items sorted by name. */
    public function findAll(): array;

    public function save(Item $item): void;

    public function delete(Item $item): void;

    /** Case-insensitive name lookup, optionally ignoring the item being updated. */
    public function nameExists(string $name, ?string $ignoredId = null): bool;
}
