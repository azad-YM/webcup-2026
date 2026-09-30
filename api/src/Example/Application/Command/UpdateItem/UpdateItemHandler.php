<?php

declare(strict_types=1);

namespace Example\Application\Command\UpdateItem;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Example\Application\Ports\Repository\ItemRepository;
use Example\Application\ViewModel\ItemViewModel;
use Example\Domain\Enum\ItemStatus;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class UpdateItemHandler
{
    public function __construct(private ItemRepository $items, private ItemAccessPolicy $access) {}

    public function __invoke(UpdateItemCommand $cmd): array
    {
        $this->access->assertCanWrite();
        $status = ItemStatus::tryFrom($cmd->status) ?? throw new \DomainException('Unknown item status.');
        $item = $this->items->findOrFail($cmd->id);
        if ($this->items->nameExists($cmd->name, $cmd->id)) {
            throw new \DomainException('An item with this name already exists.');
        }

        $item->update($cmd->name, $cmd->description, $status);
        $this->items->save($item);

        return ItemViewModel::fromEntity($item);
    }
}
