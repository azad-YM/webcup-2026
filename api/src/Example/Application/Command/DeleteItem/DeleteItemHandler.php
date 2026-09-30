<?php

declare(strict_types=1);

namespace Example\Application\Command\DeleteItem;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Example\Application\Ports\Repository\ItemRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class DeleteItemHandler
{
    public function __construct(private ItemRepository $items, private ItemAccessPolicy $access) {}

    public function __invoke(DeleteItemCommand $cmd): void
    {
        $this->access->assertCanWrite();
        $this->items->delete($this->items->findOrFail($cmd->id));
    }
}
