<?php

namespace Shared\Application\Ports\Repository;

use Shared\Domain\VO\Permission;

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