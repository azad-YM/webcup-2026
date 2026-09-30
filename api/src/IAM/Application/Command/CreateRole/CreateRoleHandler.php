<?php

namespace IAM\Application\Command\CreateRole;

use IAM\Application\Service\RoleCreationPolicy;
use Shared\Application\Ports\Repository\IRoleRepository;
use Shared\Application\Ports\Repository\IPermissionRepository;
use Shared\Domain\Entity\Role;
use Shared\Domain\VO\Permission;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
class CreateRoleHandler
{
    public function __construct(
        private readonly IRoleRepository $repository,
        private readonly IIdProvider $idProvider,
        private readonly IPermissionRepository $permissionRepository,
        private readonly RoleCreationPolicy $authorization,
    ) {}

    public function __invoke(CreateRoleCommand $cmd): void
    {
        $this->authorization->assertAllowed();
        $name = trim($cmd->name);
        if ($name === '') {
            throw new \DomainException('Role name is required.');
        }
        $permissions = array_map(
            fn(array $permission) => Permission::fromArray($permission),
            $cmd->permissions,
        );

        $catalog = $this->permissionRepository->findAllPermissions();
        foreach ($permissions as $permission) {
            $matches = array_filter($catalog, fn(Permission $known) =>
                $known->context === $permission->context
                && $known->resource === $permission->resource
                && $known->action === $permission->action
            );
            if ($matches === []) {
                throw new \DomainException('Unknown permission: ' . $permission->key());
            }
        }

        $this->repository->save(Role::create($this->idProvider->getId(), $name, $permissions));
    }
}
