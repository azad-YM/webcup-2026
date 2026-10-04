<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit;

use Administration\Application\Query\ListPermissions\ListPermissionsHandler;
use Administration\Application\Query\ListPermissions\ListPermissionsQuery;
use Administration\Application\Service\PermissionCatalogAccessPolicy;
use Administration\Domain\Entity\Member;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Administration\Domain\Entity\Role;
use Shared\Domain\Exception\AccessDeniedException;
use Administration\Domain\VO\Permission;
use Tests\Administration\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Administration\Doubles\Repository\RamMemberRepository;
use Tests\Administration\Doubles\Repository\RamRoleRepository;
use Tests\Administration\Doubles\Repository\StubPermissionRepository;

#[Group('Unit')]
final class ListPermissionsTest extends TestCase
{
    #[DataProvider('allowedActions')]
    public function testReturnsWholeCatalogRatherThanOnlyActorPermissions(string $action): void
    {
        $catalog = [new Permission('admin', 'role', 'read'), new Permission('external', 'contract', 'write')];
        $handler = $this->handler($catalog, new Member('member', 'actor-id', 'Admin', ['role']), [new Permission('admin', 'role', $action)]);
        self::assertSame([
            ['context' => 'admin', 'resource' => 'role', 'action' => 'read'],
            ['context' => 'external', 'resource' => 'contract', 'action' => 'write'],
        ], $handler(new ListPermissionsQuery()));
    }

    public static function allowedActions(): iterable
    {
        yield ['read'];
        yield ['write'];
    }

    public function testEmptyCatalogReturnsEmptyList(): void
    {
        $handler = $this->handler([], new Member('member', 'actor-id', 'Admin', ['role']), [new Permission('admin', 'role', 'read')]);
        self::assertSame([], $handler(new ListPermissionsQuery()));
    }

    #[DataProvider('deniedMembers')]
    public function testRejectsUnauthorizedActors(?Member $member, array $permissions): void
    {
        $this->expectException(AccessDeniedException::class);
        ($this->handler([], $member, $permissions))(new ListPermissionsQuery());
    }

    public static function deniedMembers(): iterable
    {
        yield 'no membership' => [null, []];
        yield 'inactive' => [new Member('member', 'actor-id', 'Admin', ['role'], false), [new Permission('admin', 'role', 'read')]];
        yield 'no role' => [new Member('member', 'actor-id', 'Admin', []), []];
        yield 'foreign permission' => [new Member('member', 'actor-id', 'Admin', ['role']), [new Permission('external', 'role', 'read')]];
        yield 'unrelated permission' => [new Member('member', 'actor-id', 'Admin', ['role']), [new Permission('admin', 'member', 'write')]];
    }

    private function handler(array $catalog, ?Member $member, array $permissions): ListPermissionsHandler
    {
        $members = new RamMemberRepository();
        if ($member !== null) {
            $members->save($member);
        }
        $roles = new RamRoleRepository();
        $roles->save(new Role('role', 'Admin', $permissions));
        return new ListPermissionsHandler(new StubPermissionRepository($catalog), new PermissionCatalogAccessPolicy(new StubCurrentAccountProvider(), $members, $roles));
    }
}
