<?php

declare(strict_types=1);

namespace Tests\Example\Suites\Unit\Command;

use Example\Application\Command\CreateItem\CreateItemCommand;
use Example\Application\Command\CreateItem\CreateItemHandler;
use Example\Application\Command\DeleteItem\DeleteItemCommand;
use Example\Application\Command\DeleteItem\DeleteItemHandler;
use Example\Application\Command\UpdateItem\UpdateItemCommand;
use Example\Application\Command\UpdateItem\UpdateItemHandler;
use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use Example\Domain\Event\ItemCreated;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Tests\Example\Doubles\Provider\StubItemAccessPolicy;
use Tests\Example\Doubles\Repository\RamItemRepository;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class ItemCommandsTest extends TestCase
{
    private RamItemRepository $items;
    private StubItemAccessPolicy $access;
    private CreateItemHandler $handler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldCreateItemAndPublishItsEvent(): void
    {
        $item = $this->execute($this->makeCommand());

        self::assertSame('item-id', $item->id());
        self::assertSame('First item', $item->name());
        self::assertSame(ItemStatus::ACTIVE, $item->status());
        self::assertEquals(new \DateTimeImmutable('2026-01-01T10:00:00+00:00'), $item->createdAt());
        self::assertEquals([new ItemCreated('item-id', 'First item')], $this->items->events);
    }

    public function test_shouldRejectDuplicateNameWithoutSaving(): void
    {
        $this->execute($this->makeCommand());
        $this->expectException(\DomainException::class);
        try {
            ($this->handler)($this->makeCommand(['name' => '  FIRST ITEM  ']));
        } finally {
            self::assertCount(1, $this->items->findAll());
            self::assertCount(1, $this->items->events);
        }
    }

    public function test_shouldUpdateItemAndKeepItsOwnName(): void
    {
        $this->execute($this->makeCommand());
        $result = $this->update(new UpdateItemCommand('item-id', '  FIRST ITEM  ', 'New details', 'archived'));

        self::assertSame('FIRST ITEM', $result['name']);
        self::assertSame('archived', $result['status']);
        self::assertSame(ItemStatus::ARCHIVED, $this->items->findOrFail('item-id')->status());
    }

    public function test_shouldRejectUnknownStatusWithoutChangingItem(): void
    {
        $this->execute($this->makeCommand());
        $this->expectException(\DomainException::class);
        try {
            $this->update(new UpdateItemCommand('item-id', 'Changed', '', 'unknown'));
        } finally {
            self::assertSame('First item', $this->items->findOrFail('item-id')->name());
        }
    }

    public function test_shouldDeleteItem(): void
    {
        $this->execute($this->makeCommand());
        (new DeleteItemHandler($this->items, $this->access))(new DeleteItemCommand('item-id'));

        self::assertSame([], $this->items->findAll());
    }

    #[DataProvider('missingOperations')]
    public function test_shouldRejectUnknownItem(string $operation): void
    {
        $this->expectException(NotFoundException::class);
        match ($operation) {
            'update' => $this->update(new UpdateItemCommand('missing', 'Changed', '', 'active')),
            'delete' => (new DeleteItemHandler($this->items, $this->access))(new DeleteItemCommand('missing')),
        };
    }

    public static function missingOperations(): iterable
    {
        yield 'update' => ['update'];
        yield 'delete' => ['delete'];
    }

    #[DataProvider('writeOperations')]
    public function test_shouldDenyAccessBeforeAnyMutation(string $operation): void
    {
        $this->execute($this->makeCommand());
        $this->access->writeAllowed = false;
        $this->expectException(AccessDeniedException::class);
        try {
            match ($operation) {
                'create' => ($this->handler)($this->makeCommand(['name' => 'Other'])),
                'update' => $this->update(new UpdateItemCommand('item-id', 'Changed', '', 'archived')),
                'delete' => (new DeleteItemHandler($this->items, $this->access))(new DeleteItemCommand('item-id')),
            };
        } finally {
            self::assertCount(1, $this->items->findAll());
            self::assertSame('First item', $this->items->findOrFail('item-id')->name());
        }
    }

    public static function writeOperations(): iterable
    {
        foreach (['create', 'update', 'delete'] as $operation) {
            yield $operation => [$operation];
        }
    }

    private function bootHandler(): void
    {
        $this->items = new RamItemRepository();
        $this->access = new StubItemAccessPolicy();
        $clock = $this->createStub(IClock::class);
        $clock->method('now')->willReturn(new \DateTimeImmutable('2026-01-01T10:00:00+00:00'));
        $this->handler = new CreateItemHandler($this->items, new SequenceIdProvider(['item-id', 'other-id']), $clock, $this->access);
    }

    private function makeCommand(array $override = []): CreateItemCommand
    {
        return new CreateItemCommand($override['name'] ?? '  First item  ', $override['description'] ?? 'Details');
    }

    private function execute(CreateItemCommand $command): Item
    {
        $result = ($this->handler)($command);

        return $this->items->findOrFail($result['id']);
    }

    private function update(UpdateItemCommand $command): array
    {
        return (new UpdateItemHandler($this->items, $this->access))($command);
    }
}
