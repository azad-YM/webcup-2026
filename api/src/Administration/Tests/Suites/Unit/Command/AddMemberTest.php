<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit\Command;

use Administration\Application\Command\AddMember\AddMemberCommand;
use Administration\Application\Command\AddMember\AddMemberHandler;
use Tests\Administration\Doubles\Repository\RamMemberRepository;
use Tests\Administration\Doubles\Provider\StubMemberAccountProvisioner;
use Tests\Administration\Doubles\Provider\StubCurrentAccountProvider;
use Administration\Application\Service\MemberRoleAssignmentPolicy;
use Administration\Domain\Entity\Member;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Tests\Administration\Doubles\Repository\RamRoleRepository;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class AddMemberTest extends TestCase
{
    private AddMemberHandler $handler;
    private RamMemberRepository $members;
    private StubMemberAccountProvisioner $accounts;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldCreateMemberWithRolesAndPublishWithoutPassword(): void
    {
        $member = $this->execute($this->makeCommand());
        self::assertSame('account-id', $member->userId);
        self::assertSame(['role-id'], $member->roleIds);
        self::assertSame('Initial-password-123', $this->accounts->receivedPassword);
        self::assertCount(1, $this->members->events);
        self::assertSame('member-id', $this->members->events[0]->memberId);
        self::assertStringNotContainsString('Initial-password-123', serialize($member));
        self::assertStringNotContainsString('Initial-password-123', serialize($this->members->events));
    }

    public function test_shouldRejectUnknownRoleBeforeCreatingAccount(): void
    {
        $this->expectException(\DomainException::class);
        try {
            $this->execute($this->makeCommand(['roleIds' => ['unknown']]));
        } finally {
            self::assertNull($this->accounts->receivedPassword);
            self::assertNull($this->members->findByUserId('account-id'));
            self::assertSame([], $this->members->events);
        }
    }

    public function test_shouldNotSaveMemberWhenAccountCreationFails(): void
    {
        $this->accounts->fail = true;
        $this->expectException(\DomainException::class);
        try {
            $this->execute($this->makeCommand());
        } finally {
            self::assertNull($this->members->findByUserId('account-id'));
            self::assertSame([], $this->members->events);
        }
    }

    private function bootHandler(): void
    {
        $roles = new RamRoleRepository();
        $roles->save(Role::create('role-id', 'Reader', [new Permission('admin', 'role', 'read')]));
        $this->members = new RamMemberRepository();
        $this->accounts = new StubMemberAccountProvisioner();
        $roles->save(Role::create('admin-role', 'Admin', [new Permission('admin', 'member', 'write'), new Permission('admin', 'role-assignment', 'write')]));
        $this->members->save(new Member('actor-member', 'actor-id', 'Admin', ['admin-role']));
        $identity = new StubCurrentAccountProvider();
        $this->handler = new AddMemberHandler($this->members, $roles, $this->accounts, new MemberRoleAssignmentPolicy($identity, $this->members, $roles), new SequenceIdProvider(['member-id']));
    }

    private function makeCommand(array $override = []): AddMemberCommand
    {
        return new AddMemberCommand('New Member', 'new@example.com', 'Initial-password-123', $override['roleIds'] ?? ['role-id']);
    }

    private function execute(AddMemberCommand $command): Member
    {
        ($this->handler)($command);
        return $this->members->findByUserId('account-id');
    }
}
