<?php

namespace Administration\Application\Ports\Repository;

use Administration\Domain\VO\Permission;

interface IPermissionRepository 
{
    /**
     * @return Permission[]
     */
    public function findAllPermissions(): array;

    /**
     * @return Permission[]
     */
    public function findPermissionsByContext(string $context): array;
}