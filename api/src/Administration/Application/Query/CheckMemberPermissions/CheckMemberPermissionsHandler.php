<?php

declare(strict_types=1);

namespace Administration\Application\Query\CheckMemberPermissions;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Application\Ports\Repository\MemberRepository;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** True when the account is an active member whose roles grant every requested permission. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class CheckMemberPermissionsHandler
{
    public function __construct(
        private MemberRepository $members,
        private IRoleRepository $roles,
    ) {}

    public function __invoke(CheckMemberPermissionsQuery $query): bool
    {
        $actor = $this->members->findByUserId($query->userId);
        if ($actor === null || !$actor->active || $query->permissions === []) {
            return false;
        }
        $permissions = [];
        foreach ($actor->roleIds as $roleId) {
            try {
                $role = $this->roles->findByIdOrFail($roleId);
            } catch (NotFoundException) {
                continue;
            }
            foreach ($role->permissions as $permission) {
                $permissions[] = $permission->key();
            }
        }

        return array_diff($query->permissions, $permissions) === [];
    }
}
