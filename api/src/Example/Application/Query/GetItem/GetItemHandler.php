<?php

declare(strict_types=1);

namespace Example\Application\Query\GetItem;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Example\Application\Ports\Repository\ItemRepository;
use Example\Application\ViewModel\ItemViewModel;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetItemHandler
{
    public function __construct(private ItemRepository $items, private ItemAccessPolicy $access) {}

    public function __invoke(GetItemQuery $query): array
    {
        $this->access->assertCanRead();

        return ItemViewModel::fromEntity($this->items->findOrFail($query->id));
    }
}
