<?php

namespace Tests\Administration\Doubles\Repository;

use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Domain\VO\Permission;

final class StubPermissionRepository implements IPermissionRepository
{
    /** @param Permission[] $permissions */
    public function __construct(private array $permissions) {}

    public function findAllPermissions(): array
    {
        return $this->permissions;
    }

    public function findPermissionsByContext(string $context): array
    {
        return array_values(array_filter(
            $this->permissions,
            fn(Permission $permission) => $permission->context === $context,
        ));
    }
}
