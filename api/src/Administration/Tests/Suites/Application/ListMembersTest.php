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
final class ListMembersTest extends ApplicationTestCase
{
    private const URI = '/api/administration/members';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
        $roles = self::getContainer()->get(IRoleRepository::class);
        $roles->save(new Role('admin-role', 'Administrateur', [
            new Permission('admin', 'member', 'read'), new Permission('admin', 'member', 'write'), new Permission('admin', 'role-assignment', 'write'),
        ]));
        $roles->save(new Role('agent', 'Agent municipal', [new Permission('admin', 'pilotage', 'read')]));
    }

    public function testListsMembersAndIncludesANewlyAddedMember(): void
    {
        $this->member('actor', 'test-user', 'Zoé Admin', ['admin-role']);
        $this->request('POST', self::URI, ['name' => 'Alice Agent', 'email' => 'alice@example.com', 'password' => 'Initial-password-123', 'roleIds' => ['agent']]);
        self::assertResponseStatusCodeSame(200);
        $created = json_decode(self::$client->getResponse()->getContent(), true);

        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
        self::assertSame([
            ['id' => $created['id'], 'userId' => $created['userId'], 'name' => 'Alice Agent', 'roles' => [['id' => 'agent', 'name' => 'Agent municipal']], 'active' => true],
            ['id' => 'actor', 'userId' => 'test-user', 'name' => 'Zoé Admin', 'roles' => [['id' => 'admin-role', 'name' => 'Administrateur']], 'active' => true],
        ], json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR));
    }

    public function testReadPermissionAloneIsEnough(): void
    {
        self::getContainer()->get(IRoleRepository::class)->save(new Role('reader', 'Lecteur', [new Permission('admin', 'member', 'read')]));
        $this->member('actor', 'test-user', 'Lecteur', ['reader']);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
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

    public function testRejectsAgentWithoutMemberPermission(): void
    {
        $this->member('actor', 'test-user', 'Agent', ['agent']);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    public function testRejectsInactiveMember(): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member('actor', 'test-user', 'Admin', ['admin-role'], false));
        $manager->flush();
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    /** @param list<string> $roleIds */
    private function member(string $id, string $userId, string $name, array $roleIds): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member($id, $userId, $name, $roleIds));
        $manager->flush();
    }
}
