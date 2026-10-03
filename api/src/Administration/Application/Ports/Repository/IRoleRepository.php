<?php

namespace Administration\Application\Ports\Repository;

use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;

interface IRoleRepository
{
    /**
     * @return Permission[]
     */
    public function findAllPermissions(): array;

    /**
     * @return Role[]
     */
    public function findAll(): array;

    public function findByIdOrFail(string $roleId): Role;

    public function save(Role $role): void;

    public function delete(string $roleId): void;
}
