<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\ListMembers\ListMembersHandler;
use Administration\Application\Query\ListMembers\ListMembersQuery;
use Administration\Application\Service\MemberReadPolicy;
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
final class ListMembersTest extends TestCase
{
    private RamMemberRepository $members;
    private RamRoleRepository $roles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->members = new RamMemberRepository();
        $this->roles = new RamRoleRepository();
        $this->roles->save(new Role('agent', 'Agent municipal', [new Permission('admin', 'pilotage', 'read')]));
    }

    #[DataProvider('allowedActions')]
    public function testListsMembersSortedByNameWithRoleNamesAndStatus(string $action): void
    {
        $this->roles->save(new Role('manager', 'Gestion des membres', [new Permission('admin', 'member', $action)]));
        $this->members->save(new Member('m-actor', 'actor-id', 'Zoé Admin', ['manager']));
        $this->members->save(new Member('m-agent', 'agent-user', 'Alice Agent', ['agent', 'deleted-role'], false));

        self::assertSame([
            ['id' => 'm-agent', 'userId' => 'agent-user', 'name' => 'Alice Agent', 'roles' => [['id' => 'agent', 'name' => 'Agent municipal']], 'active' => false],
            ['id' => 'm-actor', 'userId' => 'actor-id', 'name' => 'Zoé Admin', 'roles' => [['id' => 'manager', 'name' => 'Gestion des membres']], 'active' => true],
        ], $this->execute());
    }

    public static function allowedActions(): iterable
    {
        yield ['read'];
        yield ['write'];
    }

    #[DataProvider('deniedMembers')]
    public function testRejectsActorsWithoutMemberPermission(?Member $member): void
    {
        if ($member !== null) {
            $this->members->save($member);
        }
        $this->expectException(AccessDeniedException::class);
        $this->execute();
    }

    public static function deniedMembers(): iterable
    {
        yield 'no membership' => [null];
        yield 'agent role only' => [new Member('member', 'actor-id', 'Agent', ['agent'])];
    }

    public function testRejectsInactiveMember(): void
    {
        $this->roles->save(new Role('manager', 'Gestion', [new Permission('admin', 'member', 'read')]));
        $this->members->save(new Member('member', 'actor-id', 'Admin', ['manager'], false));
        $this->expectException(AccessDeniedException::class);
        $this->execute();
    }

    private function execute(): array
    {
        $check = new CheckCurrentMemberPermissionsHandler(new StubCurrentAccountProvider(), $this->members, $this->roles);
        $handler = new ListMembersHandler($this->members, $this->roles, new MemberReadPolicy($check));

        return $handler(new ListMembersQuery());
    }
}
