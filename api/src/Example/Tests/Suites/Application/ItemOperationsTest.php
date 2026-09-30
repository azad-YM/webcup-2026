<?php

declare(strict_types=1);

namespace Tests\Example\Suites\Application;

use IAM\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use Example\Domain\Event\ItemCreated;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Shared\Domain\Entity\Role;
use Shared\Domain\VO\Permission;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;
use Zenstruck\Messenger\Test\InteractsWithMessenger;

/** Real route, MapRequestPayload, Messenger, IAM access adapter and Doctrine. */
#[Group('Application')]
final class ItemOperationsTest extends ApplicationTestCase
{
    use InteractsWithMessenger;

    private const URI = '/api/example/items';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $user = new UserFixture();
        $this->load([$user]);
        $user->authenticate(self::$client);
    }

    public function test_createsListsGetsUpdatesAndDeletesThroughHttp(): void
    {
        $this->authorize();
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        self::assertSame([], $this->body());

        $id = $this->createItem();
        self::assertSame('First item', $this->item($id)?->name());
        $this->transport('async')->queue()->assertContains(ItemCreated::class, 1);

        $this->request('GET', self::URI . '/' . $id);
        self::assertResponseStatusCodeSame(200);
        self::assertSame('First item', $this->body()['name']);

        $this->request('PUT', self::URI, ['id' => $id, 'name' => '  Renamed  ', 'description' => '', 'status' => 'archived']);
        self::assertResponseStatusCodeSame(200);
        self::assertSame(ItemStatus::ARCHIVED, $this->item($id)?->status());
        $this->request('GET', self::URI . '?status=archived');
        self::assertSame(['Renamed'], array_column($this->body(), 'name'));

        $this->request('DELETE', self::URI, ['id' => $id]);
        self::assertResponseStatusCodeSame(200);
        self::assertNull($this->item($id));
    }

    #[DataProvider('invalidPayloads')]
    public function test_rejectsInvalidPayloadWithoutPersistence(array $override): void
    {
        $this->authorize();
        $this->request('POST', self::URI, $this->payload($override));
        self::assertResponseStatusCodeSame(422);
        self::assertSame([], $this->manager()->getRepository(Item::class)->findAll());
        $this->transport('async')->queue()->assertEmpty();
    }

    public static function invalidPayloads(): iterable
    {
        yield 'blank name' => [['name' => '   ']];
        yield 'long name' => [['name' => str_repeat('é', Item::NAME_MAX_LENGTH + 1)]];
        yield 'long description' => [['description' => str_repeat('a', Item::DESCRIPTION_MAX_LENGTH + 1)]];
    }

    public function test_rejectsDuplicateName(): void
    {
        $this->authorize();
        $this->createItem();
        $this->request('POST', self::URI, $this->payload(['name' => 'FIRST ITEM']));
        self::assertResponseStatusCodeSame(422);
        self::assertCount(1, $this->manager()->getRepository(Item::class)->findAll());
    }

    public function test_unknownItemReturnsNotFound(): void
    {
        $this->authorize();
        $this->request('GET', self::URI . '/unknown');
        self::assertResponseStatusCodeSame(404);
        $this->request('DELETE', self::URI, ['id' => 'unknown']);
        self::assertResponseStatusCodeSame(404);
    }

    public function test_readPermissionDoesNotGrantWrite(): void
    {
        $this->authorize([new Permission('admin', 'item', 'read')]);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        $this->request('POST', self::URI, $this->payload());
        self::assertResponseStatusCodeSame(403);
        self::assertSame([], $this->manager()->getRepository(Item::class)->findAll());
    }

    #[DataProvider('deniedActors')]
    public function test_rejectsUnauthorizedActors(string $actor): void
    {
        match ($actor) {
            'anonymous' => self::$client->setServerParameter('HTTP_AUTHORIZATION', ''),
            'inactive member' => $this->authorize(active: false),
            'unrelated permission' => $this->authorize([new Permission('admin', 'role', 'write')]),
            'no membership' => null,
        };
        $this->request('POST', self::URI, $this->payload());
        self::assertResponseStatusCodeSame($actor === 'anonymous' ? 401 : 403);
        self::assertSame([], $this->manager()->getRepository(Item::class)->findAll());
    }

    public static function deniedActors(): iterable
    {
        foreach (['anonymous', 'no membership', 'inactive member', 'unrelated permission'] as $actor) {
            yield $actor => [$actor];
        }
    }

    /** @param list<Permission>|null $permissions */
    private function authorize(?array $permissions = null, bool $active = true): void
    {
        $manager = $this->manager();
        $manager->persist(new Role('item-manager', 'Item manager', $permissions ?? [new Permission('admin', 'item', 'read'), new Permission('admin', 'item', 'write')]));
        $manager->persist(new Member('member', 'test-user', 'Admin', ['item-manager'], $active));
        $manager->flush();
    }

    private function createItem(): string
    {
        $this->request('POST', self::URI, $this->payload());
        self::assertResponseStatusCodeSame(200);

        return $this->body()['id'];
    }

    private function payload(array $override = []): array
    {
        return array_replace(['name' => '  First item  ', 'description' => 'Details'], $override);
    }

    private function body(): mixed
    {
        return json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
    }

    private function manager(): EntityManagerInterface
    {
        return self::getContainer()->get(EntityManagerInterface::class);
    }

    private function item(string $id): ?Item
    {
        return $this->manager()->find(Item::class, $id);
    }
}
