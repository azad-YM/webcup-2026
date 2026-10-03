<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class ListPermissionsTest extends ApplicationTestCase
{
    private const URI = '/api/administration/permissions';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
    }

    public function testListsTheCatalogAcceptedByRoleCreation(): void
    {
        $this->authorize();
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        $permissions = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame([
            ['context' => 'admin', 'resource' => 'role', 'action' => 'read'],
            ['context' => 'admin', 'resource' => 'role', 'action' => 'write'],
            ['context' => 'admin', 'resource' => 'member', 'action' => 'write'],
            ['context' => 'admin', 'resource' => 'role-assignment', 'action' => 'write'],
        ], $permissions);
        $this->request('POST', '/api/administration/roles', ['name' => 'From catalog', 'permissions' => $permissions]);
        self::assertResponseStatusCodeSame(200);
        $created = array_values(array_filter(self::getContainer()->get(IRoleRepository::class)->findAll(), fn (Role $role) => $role->name === 'From catalog'));
        self::assertCount(1, $created);
        self::assertCount(4, $created[0]->permissions);
    }

    public function testRejectsAnonymous(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(401);
    }

    public function testRejectsAccountWithoutMembership(): void
    {
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    public function testRejectsInactiveMember(): void
    {
        $this->authorize(active: false);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    public function testRejectsMemberWithoutRolePermission(): void
    {
        $this->authorize(action: null);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    private function authorize(bool $active = true, ?string $action = 'write'): void
    {
        self::getContainer()->get(IRoleRepository::class)->save(new Role('catalog-reader', 'Catalog reader', $action === null ? [] : [new Permission('admin', 'role', $action), new Permission('admin', 'role-assignment', 'write')]));
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member('member', 'test-user', 'Admin', ['catalog-reader'], $active));
        $manager->flush();
    }
}
