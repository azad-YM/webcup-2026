<?php

namespace Tests\Administration\Suites\Unit\Command;

use Administration\Application\Command\CreateRole\CreateRoleCommand;
use Administration\Application\Command\CreateRole\CreateRoleHandler;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Administration\Doubles\Repository\StubPermissionRepository;
use PHPUnit\Framework\TestCase;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Service\RoleCreationPolicy;
use Administration\Domain\Entity\Member;
use Shared\Domain\Exception\AccessDeniedException;
use Tests\Administration\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Administration\Doubles\Repository\RamMemberRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Tests\Administration\Doubles\Repository\RamRoleRepository;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class CreateRoleTest extends TestCase
{
    private const ROLE_ID = 'role-id';

    private RamRoleRepository $roleRepository;
    private CreateRoleHandler $handler;
    private RamMemberRepository $actors;
    private RamRoleRepository $actorRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldCreateRole(): void
    {
        $role = $this->execute($this->makeCommand());

        self::assertSame(self::ROLE_ID, $role->id);
        self::assertSame('Gestionnaire des accès', $role->name);
        self::assertEquals([
            new Permission('admin', 'role', 'read'),
            new Permission('admin', 'role', 'write'),
        ], $role->permissions);
        self::assertCount(1, $this->roleRepository->findAll());
    }

    #[DataProvider('unknownPermissions')]
    public function test_whenAtLeastOnePermissionIsUnknown_shouldFail(array $unknownPermission): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Unknown permission: ' . implode('.', $unknownPermission));

        try {
            $this->execute($this->makeCommand([
                'permissions' => [
                    ['context' => 'admin', 'resource' => 'role', 'action' => 'write'],
                    $unknownPermission,
                ],
            ]));
        } finally {
            self::assertCount(0, $this->roleRepository->findAll());
        }
    }

    public function testBlankNameIsRejectedWithoutSaving(): void
    {
        $this->expectException(\DomainException::class);
        try {
            $this->execute($this->makeCommand(['name' => '   ']));
        } finally {
            self::assertCount(0, $this->roleRepository->findAll());
        }
    }

    public function testNameIsTrimmed(): void
    {
        self::assertSame('Gestionnaire', $this->execute($this->makeCommand(['name' => '  Gestionnaire  ']))->name);
    }

    #[DataProvider('missingAuthorities')]
    public function testRequiresCreationAndDelegationPermissions(array $permissions): void
    {
        $this->actorRoles->save(new Role('admin-role', 'Admin', $permissions));
        $this->expectException(AccessDeniedException::class);
        try {
            $this->execute($this->makeCommand());
        } finally {
            self::assertSame([], $this->roleRepository->findAll());
        }
    }

    public static function missingAuthorities(): iterable
    {
        yield 'read only' => [[new Permission('admin', 'role', 'read')]];
        yield 'write without delegation' => [[new Permission('admin', 'role', 'write')]];
        yield 'delegation without creation' => [[new Permission('admin', 'role-assignment', 'write')]];
    }

    public function testInactiveActorCannotCreateRole(): void
    {
        $this->actors->save(new Member('actor', 'actor-id', 'Admin', ['admin-role'], false));
        $this->expectException(AccessDeniedException::class);
        try {
            $this->execute($this->makeCommand());
        } finally {
            self::assertSame([], $this->roleRepository->findAll());
        }
    }

    public static function unknownPermissions(): iterable
    {
        yield 'unknown context' => [['context' => 'external', 'resource' => 'role', 'action' => 'write']];
        yield 'unknown resource' => [['context' => 'admin', 'resource' => 'member', 'action' => 'write']];
        yield 'unknown action in catalog' => [['context' => 'admin', 'resource' => 'role', 'action' => 'approve']];
    }

    private function bootHandler(): void
    {
        $this->roleRepository = new RamRoleRepository();
        $this->actors = new RamMemberRepository();
        $this->actors->save(new Member('actor', 'actor-id', 'Admin', ['admin-role']));
        $this->actorRoles = new RamRoleRepository();
        $this->actorRoles->save(new Role('admin-role', 'Admin', [new Permission('admin', 'role', 'write'), new Permission('admin', 'role-assignment', 'write')]));
        $this->handler = new CreateRoleHandler(
            $this->roleRepository,
            new SequenceIdProvider([self::ROLE_ID]),
            new StubPermissionRepository([
                new Permission('admin', 'role', 'read'),
                new Permission('admin', 'role', 'write'),
            ]),
            new RoleCreationPolicy(new CheckCurrentMemberPermissionsHandler(new StubCurrentAccountProvider(), $this->actors, $this->actorRoles)),
        );
    }

    private function makeCommand(array $override = []): CreateRoleCommand
    {
        return new CreateRoleCommand(
            name: $override['name'] ?? 'Gestionnaire des accès',
            permissions: $override['permissions'] ?? [
                ['context' => 'admin', 'resource' => 'role', 'action' => 'read'],
                ['context' => 'admin', 'resource' => 'role', 'action' => 'write'],
            ],
        );
    }

    private function execute(CreateRoleCommand $command): Role
    {
        ($this->handler)($command);

        return $this->roleRepository->findByIdOrFail(self::ROLE_ID);
    }
}
