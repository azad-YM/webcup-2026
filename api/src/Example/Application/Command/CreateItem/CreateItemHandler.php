<?php

declare(strict_types=1);

namespace Example\Application\Command\CreateItem;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Example\Application\Ports\Repository\ItemRepository;
use Example\Application\ViewModel\ItemViewModel;
use Example\Domain\Entity\Item;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class CreateItemHandler
{
    public function __construct(
        private ItemRepository $items,
        private IIdProvider $ids,
        private IClock $clock,
        private ItemAccessPolicy $access,
    ) {}

    public function __invoke(CreateItemCommand $cmd): array
    {
        $this->access->assertCanWrite();
        if ($this->items->nameExists($cmd->name)) {
            throw new \DomainException('An item with this name already exists.');
        }

        $item = Item::create($this->ids->getId(), $cmd->name, $cmd->description, $this->clock->now());
        $this->items->save($item);

        return ItemViewModel::fromEntity($item);
    }
}
