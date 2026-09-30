<?php

declare(strict_types=1);

namespace Tests\Example\Suites\Unit\Entity;

use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use Example\Domain\Event\ItemCreated;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('Unit')]
final class ItemTest extends TestCase
{
    public function test_creationNormalizesInputAndRecordsItsEventOnlyOnce(): void
    {
        $item = Item::create('item-id', '  First item  ', '  Details  ', new \DateTimeImmutable('2026-01-01'));

        self::assertSame('First item', $item->name());
        self::assertSame('Details', $item->description());
        self::assertSame(ItemStatus::ACTIVE, $item->status());
        self::assertEquals([new ItemCreated('item-id', 'First item')], $item->pullDomainEvents());
        self::assertSame([], $item->pullDomainEvents());
    }

    public function test_reconstitutionDoesNotRecordCreation(): void
    {
        $item = Item::reconstitute('item-id', 'Item', '', ItemStatus::ARCHIVED, new \DateTimeImmutable());

        self::assertSame([], $item->pullDomainEvents());
    }

    #[DataProvider('invalidNames')]
    public function test_invalidUpdateLeavesItemUnchanged(string $name): void
    {
        $item = Item::reconstitute('item-id', 'Item', 'Details', ItemStatus::ACTIVE, new \DateTimeImmutable());
        $this->expectException(\DomainException::class);
        try {
            $item->update($name, 'Changed', ItemStatus::ARCHIVED);
        } finally {
            self::assertSame('Item', $item->name());
            self::assertSame('Details', $item->description());
            self::assertSame(ItemStatus::ACTIVE, $item->status());
        }
    }

    public static function invalidNames(): iterable
    {
        yield 'blank' => ['   '];
        yield 'too long' => [str_repeat('é', Item::NAME_MAX_LENGTH + 1)];
    }

    public function test_rejectsTooLongDescription(): void
    {
        $this->expectException(\DomainException::class);
        Item::create('item-id', 'Item', str_repeat('a', Item::DESCRIPTION_MAX_LENGTH + 1), new \DateTimeImmutable());
    }
}
