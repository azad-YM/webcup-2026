<?php

namespace Tests\IAM\Doubles\Repository;

use Shared\Application\Ports\Repository\IRoleRepository;
use Shared\Domain\Entity\Role;
use Shared\Domain\Exception\NotFoundException;

final class RamRoleRepository implements IRoleRepository
{
    /** @var array<string, Role> */
    private array $roles = [];

    public function findAllPermissions(): array
    {
        return array_merge([], ...array_map(fn(Role $role) => $role->permissions, $this->findAll()));
    }

    public function findAll(): array
    {
        return array_values($this->roles);
    }

    public function findByIdOrFail(string $roleId): Role
    {
        return $this->roles[$roleId] ?? throw new NotFoundException('Role not found');
    }

    public function save(Role $role): void
    {
        $this->roles[$role->id] = $role;
    }

    public function delete(string $roleId): void
    {
        $this->findByIdOrFail($roleId);
        unset($this->roles[$roleId]);
    }
}
