<?php

declare(strict_types=1);

namespace IAM\Application\Query\ListPermissions;

use IAM\Application\Service\PermissionCatalogAccessPolicy;
use Shared\Application\Ports\Repository\IPermissionRepository;
use Shared\Domain\VO\Permission;
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
