<?php

namespace Administration\Application\Command\CreateRole;

use Administration\Application\Service\RoleCreationPolicy;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
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
