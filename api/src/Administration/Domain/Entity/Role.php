<?php

namespace Administration\Domain\Entity;

use Administration\Domain\VO\Permission;

class Role
{
    /**
     * @param Permission[] $permissions
     */
    public function __construct(
        public readonly string $id,
        public string $name,
        public array $permissions,
    ) {}

    /**
     * @param Permission[] $permissions
     */
    public static function create(string $id, string $name, array $permissions): self
    {
        return new self($id, $name, $permissions);
    }

    /**
     * @param Permission[] $permissions
     */
    public function update(string $name, array $permissions): void
    {
        $this->name = $name;
        $this->permissions = $permissions;
    }
}
