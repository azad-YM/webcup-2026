<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListPermissions;

use Administration\Application\Service\PermissionCatalogAccessPolicy;
use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Domain\VO\Permission;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListPermissionsHandler
{
    public function __construct(
        private IPermissionRepository $permissions,
        private PermissionCatalogAccessPolicy $authorization,
    ) {}

    /** @return list<array{context: string, resource: string, action: string}> */
    public function __invoke(ListPermissionsQuery $query): array
    {
        $this->authorization->assertAllowed();

        return array_values(array_map(
            static fn (Permission $permission): array => [
                'context' => $permission->context,
                'resource' => $permission->resource,
                'action' => $permission->action,
            ],
            $this->permissions->findAllPermissions(),
        ));
    }
}
