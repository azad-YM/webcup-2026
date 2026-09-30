<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessHandler;
use IAM\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessQuery;
use IAM\Domain\Entity\Member;
use IAM\Infrastructure\Service\AdminAccessibleSpacesProvider;
use IAM\Application\DTO\AccessibleSpace;
use Shared\Domain\Entity\Role;
use Tests\IAM\Doubles\Repository\RamRoleRepository;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Tests\IAM\Doubles\Repository\RamMemberRepository;

#[Group('Unit')]
final class GetMemberSpaceAccessTest extends TestCase
{
    public function testOnlyActiveMembershipForRequestedUserGrantsAccess(): void
    {
        $members = new RamMemberRepository();
        $members->save(new Member('active-member', 'active-user', 'Active', ['admin', 'manager']));
        $members->save(new Member('inactive-member', 'inactive-user', 'Inactive', [], false));
        $roles = new RamRoleRepository();
        $roles->save(new Role('admin', 'Administrateur', []));
        $roles->save(new Role('manager', 'Gestionnaire', []));
        $roles->save(new Role('unassigned', 'Auditeur', []));
        $handler = new GetMemberSpaceAccessHandler($members, $roles);
        self::assertSame(['Administrateur', 'Gestionnaire'], $handler(new GetMemberSpaceAccessQuery('active-user'))->roles);
        self::assertNull($handler(new GetMemberSpaceAccessQuery('inactive-user')));
        self::assertNull($handler(new GetMemberSpaceAccessQuery('unknown-user')));

        $members->save(new Member('without-roles', 'without-roles', 'Sans rôle', []));
        self::assertSame([], $handler(new GetMemberSpaceAccessQuery('without-roles'))->roles);

        $provider = new AdminAccessibleSpacesProvider($handler);
        self::assertEquals([new AccessibleSpace('admin', 'Administration', 'Gérez les comptes, les rôles et les modules de l’application.', ['Administrateur', 'Gestionnaire'])], $provider->findForUser('active-user'));
        self::assertSame([], $provider->findForUser('inactive-user'));
        self::assertSame([], $provider->findForUser('unknown-user'));
    }
}
