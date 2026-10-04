<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class CreateRoleTest extends ApplicationTestCase
{
    private const URI = '/api/administration/roles';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
        $this->authorize();
    }

    public function test_shouldCreateRole(): void
    {
        $role = $this->createRole();

        self::assertResponseStatusCodeSame(200);
        self::assertInstanceOf(Role::class, $role);
        self::assertNotEmpty($role->id);
        self::assertSame('Gestionnaire des accès', $role->name);
        self::assertEquals([
            new Permission('admin', 'role', 'read'),
            new Permission('admin', 'role', 'write'),
        ], $role->permissions);
    }

    public function test_whenAtLeastOnePermissionIsUnknown_shouldRejectWithoutSaving(): void
    {
        $this->request('POST', self::URI, array_merge($this->defaultPayload(), [
            'permissions' => [
                ['context' => 'admin', 'resource' => 'role', 'action' => 'write'],
                ['context' => 'admin', 'resource' => 'role', 'action' => 'approve'],
            ],
        ]));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['error' => 'Unknown permission: admin.role.approve'],
            json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR));
        self::assertCount(0, $this->roles());
    }

    public function test_whenAnonymous_shouldRejectWithoutSaving(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', self::URI, $this->defaultPayload());

        self::assertResponseStatusCodeSame(401);
        self::assertCount(0, $this->roles());
    }

    public function test_whenPermissionPayloadIsIncomplete_shouldRejectWithoutSaving(): void
    {
        $this->request('POST', self::URI, array_merge($this->defaultPayload(), [
            'permissions' => [['context' => 'admin', 'resource' => 'role']],
        ]));

        self::assertResponseStatusCodeSame(422);
        self::assertCount(0, $this->roles());
    }

    public function testBlankNameIsRejectedWithoutSaving(): void
    {
        $this->request('POST', self::URI, array_merge($this->defaultPayload(), ['name' => '   ']));
        self::assertResponseStatusCodeSame(422);
        self::assertCount(0, $this->roles());
    }

    #[DataProvider('deniedActors')]
    public function testRejectsActorWithoutCreationAndDelegation(bool $active, array $keys, bool $memberExists): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $member = $manager->find(Member::class, 'actor-member');
        $manager->remove($member);
        $manager->flush();
        $manager->clear();
        $role = $manager->find(Role::class, 'actor-role');
        $role->permissions = array_map(fn (string $key) => new Permission('admin', $key, 'write'), $keys);
        if ($memberExists) {
            $manager->persist(new Member('actor-member', 'test-user', 'Admin', ['actor-role'], $active));
        }
        $manager->flush();
        $this->request('POST', self::URI, $this->defaultPayload());
        self::assertResponseStatusCodeSame(403);
        self::assertSame([], $this->roles());
    }

    public static function deniedActors(): iterable
    {
        yield 'not a member' => [true, ['role', 'role-assignment'], false];
        yield 'inactive' => [false, ['role', 'role-assignment'], true];
        yield 'no creation' => [true, ['role-assignment'], true];
        yield 'no delegation' => [true, ['role'], true];
    }

    private function authorize(): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Role('actor-role', 'Admin', [new Permission('admin', 'role', 'write'), new Permission('admin', 'role-assignment', 'write')]));
        $manager->persist(new Member('actor-member', 'test-user', 'Admin', ['actor-role']));
        $manager->flush();
    }

    private function createRole(array $payload = []): Role
    {
        $this->request('POST', self::URI, array_merge($this->defaultPayload(), $payload));
        self::assertResponseStatusCodeSame(200);
        $roles = $this->roles();
        self::assertCount(1, $roles);

        return $roles[0];
    }

    private function defaultPayload(): array
    {
        return [
            'name' => 'Gestionnaire des accès',
            'permissions' => [
                ['context' => 'admin', 'resource' => 'role', 'action' => 'read'],
                ['context' => 'admin', 'resource' => 'role', 'action' => 'write'],
            ],
        ];
    }

    /** @return Role[] */
    private function roles(): array
    {
        return array_values(array_filter(self::getContainer()->get(IRoleRepository::class)->findAll(), fn (Role $role) => $role->id !== 'actor-role'));
    }
}
