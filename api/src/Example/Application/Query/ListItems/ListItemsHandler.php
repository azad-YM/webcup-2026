<?php

declare(strict_types=1);

namespace Example\Application\Query\ListItems;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Example\Application\Ports\Repository\ItemRepository;
use Example\Application\ViewModel\ItemViewModel;
use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListItemsHandler
{
    public function __construct(private ItemRepository $items, private ItemAccessPolicy $access) {}

    /** @return list<array<string, string>> */
    public function __invoke(ListItemsQuery $query): array
    {
        $this->access->assertCanRead();
        $status = $query->status === null ? null
            : (ItemStatus::tryFrom($query->status) ?? throw new \DomainException('Unknown item status.'));

        return array_values(array_map(
            static fn (Item $item): array => ItemViewModel::fromEntity($item),
            array_filter($this->items->findAll(), static fn (Item $item): bool => $status === null || $item->status() === $status),
        ));
    }
}
