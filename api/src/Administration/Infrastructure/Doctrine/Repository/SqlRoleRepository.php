<?php

namespace Administration\Infrastructure\Doctrine\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Administration\Application\Ports\Repository\IPermissionRepository;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Shared\Domain\Exception\NotFoundException;

class SqlRoleRepository extends ServiceEntityRepository implements IRoleRepository
{
    /**
     * @param iterable<IPermissionRepository> $permissionsRepository
     */
    public function __construct(
        ManagerRegistry $registry,
        private iterable $permissionsRepository,
    ) {
        parent::__construct($registry, Role::class);
    }

    public function findAllPermissions(): array
    {
        return array_map(
            fn(IPermissionRepository $permissionRepository) => $permissionRepository->findAllPermissions(),
            $this->permissionsRepository,
        );
    }

    public function findAll(): array
    {
        return array_map(
            fn(Role $role) => $this->normalizePermissions($role),
            parent::findBy([], ['name' => 'ASC']),
        );
    }

    public function findByIdOrFail(string $roleId): Role
    {
        $role = $this->find($roleId);
        if (!$role) {
            throw new NotFoundException('Role not found');
        }

        return $this->normalizePermissions($role);
    }

    public function findByModule(string $module): array
    {
        return array_values(
            array_filter(
                $this->findAll(),
                fn(Role $role) => count(
                    array_filter(
                        $role->permissions,
                        fn(Permission $permission) => $permission->context === $module,
                    ),
                ) > 0,
            ),
        );
    }

    public function save(Role $role): void
    {
        $em = $this->getEntityManager();
        $em->persist($role);
        $em->flush();
    }

    public function delete(string $roleId): void
    {
        $em = $this->getEntityManager();
        $em->remove($this->findByIdOrFail($roleId));
        $em->flush();
    }

    private function normalizePermissions(Role $role): Role
    {
        $role->permissions = array_map(
            fn(Permission|array $permission) => $permission instanceof Permission
                ? $permission
                : Permission::fromArray($permission),
            $role->permissions,
        );

        return $role;
    }
}
