<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Member;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class ListRolesTest extends ApplicationTestCase
{
    private const URI = '/api/administration/roles';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
    }

    public function testListsPersistedRolesWithTheirPermissions(): void
    {
        $this->authorize([new Permission('admin', 'role', 'read')]);
        self::getContainer()->get(IRoleRepository::class)->save(new Role('agent', 'Agent municipal', [new Permission('admin', 'pilotage', 'read')]));
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        self::assertSame([
            ['id' => 'agent', 'name' => 'Agent municipal', 'permissions' => [['context' => 'admin', 'resource' => 'pilotage', 'action' => 'read']]],
            ['id' => 'actor-role', 'name' => 'Lecteur des rôles', 'permissions' => [['context' => 'admin', 'resource' => 'role', 'action' => 'read']]],
        ], json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR));
    }

    public function testCreatedRoleAppearsInTheList(): void
    {
        $this->authorize([new Permission('admin', 'role', 'write'), new Permission('admin', 'role-assignment', 'write')]);
        $this->request('POST', self::URI, ['name' => 'Nouveau', 'permissions' => [['context' => 'admin', 'resource' => 'member', 'action' => 'read']]]);
        self::assertResponseStatusCodeSame(200);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        self::assertContains('Nouveau', array_column(json_decode(self::$client->getResponse()->getContent(), true), 'name'));
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

    public function testRejectsMemberWithoutRolePermission(): void
    {
        $this->authorize([new Permission('admin', 'pilotage', 'read')]);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    /** @param Permission[] $permissions */
    private function authorize(array $permissions): void
    {
        self::getContainer()->get(IRoleRepository::class)->save(new Role('actor-role', 'Lecteur des rôles', $permissions));
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member('member', 'test-user', 'Admin', ['actor-role']));
        $manager->flush();
    }
}
