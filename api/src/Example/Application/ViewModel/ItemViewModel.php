<?php

declare(strict_types=1);

namespace Example\Application\ViewModel;

use Example\Domain\Entity\Item;

final class ItemViewModel
{
    /** @return array{id: string, name: string, description: string, status: string, createdAt: string} */
    public static function fromEntity(Item $item): array
    {
        return [
            'id' => $item->id(),
            'name' => $item->name(),
            'description' => $item->description(),
            'status' => $item->status()->value,
            'createdAt' => $item->createdAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
