<?php

declare(strict_types=1);

namespace Administration\Application\Query\CheckCurrentMemberPermissions;

use Administration\Application\Ports\Provider\CurrentAccountProvider;
use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Application\Ports\Repository\IRoleRepository;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class CheckCurrentMemberPermissionsHandler
{
    public function __construct(
        private CurrentAccountProvider $currentAccount,
        private MemberRepository $members,
        private IRoleRepository $roles,
    ) {}

    public function __invoke(CheckCurrentMemberPermissionsQuery $query): bool
    {
        $actor = $this->members->findByUserId($this->currentAccount->userId());
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
