<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit;

use Administration\Application\Query\ListRoles\ListRolesHandler;
use Administration\Application\Query\ListRoles\ListRolesQuery;
use Administration\Application\Service\PermissionCatalogAccessPolicy;
use Administration\Domain\Entity\Member;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\AccessDeniedException;
use Tests\Administration\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Administration\Doubles\Repository\RamMemberRepository;
use Tests\Administration\Doubles\Repository\RamRoleRepository;

#[Group('Unit')]
final class ListRolesTest extends TestCase
{
    private RamMemberRepository $members;
    private RamRoleRepository $roles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->members = new RamMemberRepository();
        $this->roles = new RamRoleRepository();
    }

    #[DataProvider('allowedActions')]
    public function testListsAllRolesSortedByNameWithTheirPermissions(string $action): void
    {
        $this->roles->save(new Role('reader', 'Lecteur', [new Permission('admin', 'role', $action)]));
        $this->roles->save(new Role('agent', 'Agent municipal', [new Permission('admin', 'pilotage', 'read')]));
        $this->members->save(new Member('member', 'actor-id', 'Admin', ['reader']));

        self::assertSame([
            ['id' => 'agent', 'name' => 'Agent municipal', 'permissions' => [['context' => 'admin', 'resource' => 'pilotage', 'action' => 'read']]],
            ['id' => 'reader', 'name' => 'Lecteur', 'permissions' => [['context' => 'admin', 'resource' => 'role', 'action' => $action]]],
        ], $this->execute());
    }

    public static function allowedActions(): iterable
    {
        yield ['read'];
        yield ['write'];
    }

    #[DataProvider('deniedMembers')]
    public function testRejectsActorsWithoutRolePermission(?Member $member): void
    {
        $this->roles->save(new Role('role', 'Other', [new Permission('admin', 'member', 'write')]));
        if ($member !== null) {
            $this->members->save($member);
        }
        $this->expectException(AccessDeniedException::class);
        $this->execute();
    }

    public static function deniedMembers(): iterable
    {
        yield 'no membership' => [null];
        yield 'unrelated permission' => [new Member('member', 'actor-id', 'Admin', ['role'])];
    }

    public function testRejectsInactiveMember(): void
    {
        $this->roles->save(new Role('role', 'Reader', [new Permission('admin', 'role', 'read')]));
        $this->members->save(new Member('member', 'actor-id', 'Admin', ['role'], false));
        $this->expectException(AccessDeniedException::class);
        $this->execute();
    }

    private function execute(): array
    {
        $handler = new ListRolesHandler($this->roles, new PermissionCatalogAccessPolicy(new StubCurrentAccountProvider(), $this->members, $this->roles));

        return $handler(new ListRolesQuery());
    }
}
