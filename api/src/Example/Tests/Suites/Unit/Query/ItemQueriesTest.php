<?php

declare(strict_types=1);

namespace Tests\Example\Suites\Unit\Query;

use Example\Application\Query\GetItem\GetItemHandler;
use Example\Application\Query\GetItem\GetItemQuery;
use Example\Application\Query\ListItems\ListItemsHandler;
use Example\Application\Query\ListItems\ListItemsQuery;
use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Tests\Example\Doubles\Provider\StubItemAccessPolicy;
use Tests\Example\Doubles\Repository\RamItemRepository;

#[Group('Unit')]
final class ItemQueriesTest extends TestCase
{
    private RamItemRepository $items;
    private StubItemAccessPolicy $access;

    protected function setUp(): void
    {
        parent::setUp();
        $createdAt = new \DateTimeImmutable('2026-01-01T10:00:00+00:00');
        $this->items = new RamItemRepository([
            Item::reconstitute('b', 'Beta', '', ItemStatus::ARCHIVED, $createdAt),
            Item::reconstitute('a', 'Alpha', 'First', ItemStatus::ACTIVE, $createdAt),
        ]);
        $this->access = new StubItemAccessPolicy();
    }

    public function test_listsItemsSortedByNameAndFiltersByStatus(): void
    {
        $list = new ListItemsHandler($this->items, $this->access);

        self::assertSame(['Alpha', 'Beta'], array_column($list(new ListItemsQuery()), 'name'));
        self::assertSame(['Beta'], array_column($list(new ListItemsQuery('archived')), 'name'));
    }

    public function test_rejectsUnknownStatusFilter(): void
    {
        $this->expectException(\DomainException::class);
        (new ListItemsHandler($this->items, $this->access))(new ListItemsQuery('unknown'));
    }

    public function test_getsOneItemView(): void
    {
        self::assertSame([
            'id' => 'a',
            'name' => 'Alpha',
            'description' => 'First',
            'status' => 'active',
            'createdAt' => '2026-01-01T10:00:00+00:00',
        ], (new GetItemHandler($this->items, $this->access))(new GetItemQuery('a')));
    }

    public function test_getRejectsUnknownItem(): void
    {
        $this->expectException(NotFoundException::class);
        (new GetItemHandler($this->items, $this->access))(new GetItemQuery('missing'));
    }

    public function test_readsRequireReadAccess(): void
    {
        $this->access->readAllowed = false;
        $this->expectException(AccessDeniedException::class);
        (new ListItemsHandler($this->items, $this->access))(new ListItemsQuery());
    }
}
