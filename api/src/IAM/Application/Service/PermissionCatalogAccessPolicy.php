<?php

declare(strict_types=1);

namespace IAM\Application\Service;

use IAM\Application\Ports\Provider\CurrentAccountProvider;
use IAM\Application\Ports\Repository\MemberRepository;
use Shared\Application\Ports\Repository\IRoleRepository;
use Shared\Domain\Exception\AccessDeniedException;

final readonly class PermissionCatalogAccessPolicy
{
    public function __construct(
        private CurrentAccountProvider $currentAccount,
        private MemberRepository $members,
        private IRoleRepository $roles,
    ) {}

    public function assertAllowed(): void
    {
        $actor = $this->members->findByUserId($this->currentAccount->userId());
        if ($actor === null || !$actor->active) {
            throw new AccessDeniedException('An active administration member is required.');
        }
        foreach ($actor->roleIds as $roleId) {
            foreach ($this->roles->findByIdOrFail($roleId)->permissions as $permission) {
                if (in_array($permission->key(), ['admin.role.read', 'admin.role.write'], true)) {
                    return;
                }
            }
        }
        throw new AccessDeniedException('Role read or write permission is required.');
    }
}
