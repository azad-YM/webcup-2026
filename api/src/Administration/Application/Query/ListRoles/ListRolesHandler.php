<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListRoles;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Application\Service\PermissionCatalogAccessPolicy;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Same rule as the catalog: `admin.role.read` or `admin.role.write`. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListRolesHandler
{
    public function __construct(
        private IRoleRepository $roles,
        private PermissionCatalogAccessPolicy $authorization,
    ) {}

    /** @return list<array{id: string, name: string, permissions: list<array{context: string, resource: string, action: string}>}> */
    public function __invoke(ListRolesQuery $query): array
    {
        $this->authorization->assertAllowed();
        $roles = $this->roles->findAll();
        usort($roles, static fn (Role $a, Role $b): int => [$a->name, $a->id] <=> [$b->name, $b->id]);

        return array_values(array_map(static fn (Role $role): array => [
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => array_values(array_map(static fn (Permission $permission): array => [
                'context' => $permission->context,
                'resource' => $permission->resource,
                'action' => $permission->action,
            ], $role->permissions)),
        ], $roles));
    }
}
