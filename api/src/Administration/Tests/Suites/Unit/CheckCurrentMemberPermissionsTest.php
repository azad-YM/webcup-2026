<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Domain\Entity\Member;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Tests\Administration\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Administration\Doubles\Repository\RamMemberRepository;
use Tests\Administration\Doubles\Repository\RamRoleRepository;

#[Group('Unit')]
final class CheckCurrentMemberPermissionsTest extends TestCase
{
    public function testUsesOnlyCurrentActiveMembershipAndExactPermissions(): void
    {
        $members = new RamMemberRepository();
        $roles = new RamRoleRepository();
        $handler = new CheckCurrentMemberPermissionsHandler(new StubCurrentAccountProvider(), $members, $roles);
        $query = new CheckCurrentMemberPermissionsQuery(['admin.item.read', 'admin.item.write']);
        $roles->save(new Role('reader', 'Reader', [new Permission('admin', 'item', 'read')]));
        $roles->save(new Role('writer', 'Writer', [new Permission('admin', 'item', 'write')]));
        $members->save(new Member('other', 'other-user', 'Other', ['reader', 'writer']));
        self::assertFalse($handler($query));
        $members->save(new Member('member', 'actor-id', 'Actor', ['reader']));
        self::assertFalse($handler($query));
        self::assertTrue($handler(new CheckCurrentMemberPermissionsQuery(['admin.item.read'])));
        self::assertFalse($handler(new CheckCurrentMemberPermissionsQuery(['external.item.read'])));
        self::assertFalse($handler(new CheckCurrentMemberPermissionsQuery([])));
        $members->save(new Member('member', 'actor-id', 'Actor', ['missing', 'reader', 'writer']));
        self::assertTrue($handler($query));
        $members->save(new Member('member', 'actor-id', 'Actor', ['reader', 'writer'], false));
        self::assertFalse($handler($query));
    }
}
