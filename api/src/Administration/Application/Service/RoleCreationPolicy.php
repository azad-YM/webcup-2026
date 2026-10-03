<?php

declare(strict_types=1);

namespace Administration\Application\Service;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Shared\Domain\Exception\AccessDeniedException;

final readonly class RoleCreationPolicy
{
    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function assertAllowed(): void
    {
        if (!(($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.role.write', 'admin.role-assignment.write'])))) {
            throw new AccessDeniedException('Role creation and delegation permissions are required for an active administration member.');
        }
    }
}
