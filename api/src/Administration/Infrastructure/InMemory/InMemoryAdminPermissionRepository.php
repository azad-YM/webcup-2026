<?php

namespace Administration\Infrastructure\InMemory;

use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Domain\VO\Permission;

class InMemoryAdminPermissionRepository implements IPermissionRepository {
    private array $permissions = [];

    public function __construct()
    {
        $this->permissions = [
            new Permission('admin', 'role', 'read'),
            new Permission('admin', 'role', 'write'),
            new Permission('admin', 'member', 'read'),
            new Permission('admin', 'member', 'write'),
            new Permission('admin', 'role-assignment', 'write'),
            new Permission('admin', 'pilotage', 'read'),
            new Permission('admin', 'citizen', 'read'),
            new Permission('admin', 'citizen', 'write'),
            new Permission('admin', 'security', 'read'),
            new Permission('admin', 'request', 'read'),
            new Permission('admin', 'request', 'write'),
            new Permission('admin', 'service', 'write'),
            new Permission('admin', 'communication', 'write'),
        ];
    }

    /**
     * @return Permission[]
     */
    public function findAllPermissions(): array
    {
        return $this->permissions;
    }

    /**
     * @return Permission[]
     */
    public function findPermissionsByContext(string $context): array
    {
        return array_filter(
            $this->permissions,
            fn(Permission $permission) => $permission->context === $context,
        );
    }
}
