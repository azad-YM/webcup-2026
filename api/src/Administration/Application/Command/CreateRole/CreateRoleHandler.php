<?php

namespace Administration\Application\Command\CreateRole;

use Administration\Application\Service\RoleCreationPolicy;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\AuditTrail;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
class CreateRoleHandler
{
    public function __construct(
        private readonly IRoleRepository $repository,
        private readonly IIdProvider $idProvider,
        private readonly IPermissionRepository $permissionRepository,
        private readonly RoleCreationPolicy $authorization,
        private readonly ?AuditTrail $audit = null,
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

        $role = Role::create($this->idProvider->getId(), $name, $permissions);
        $this->repository->save($role);
        $keys = array_map(static fn (Permission $permission): string => $permission->key(), $permissions);
        $this->audit?->record('administration.role.created', 'role', $role->id, sprintf('Rôle « %s » créé (%d permission(s)).', $name, count($keys)), ['name' => $name, 'permissions' => $keys]);
    }
}
