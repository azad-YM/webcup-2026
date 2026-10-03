<?php

declare(strict_types=1);

namespace Administration\Application\Service;

use Administration\Application\Ports\Provider\CurrentAccountProvider;
use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Application\Ports\Repository\IRoleRepository;
use Shared\Domain\Exception\AccessDeniedException;

final readonly class MemberRoleAssignmentPolicy
{
    public function __construct(private CurrentAccountProvider $currentAccount, private MemberRepository $members, private IRoleRepository $roles) {}

    public function assertAllowed(): void
    {
        $actor = $this->members->findByUserId($this->currentAccount->userId());
        if ($actor === null || !$actor->active) {
            throw new AccessDeniedException('An active administration member is required.');
        }
        $permissions = [];
        foreach ($actor->roleIds as $roleId) {
            foreach ($this->roles->findByIdOrFail($roleId)->permissions as $permission) {
                $permissions[] = $permission->key();
            }
        }
        if (!in_array('admin.member.write', $permissions, true) || !in_array('admin.role-assignment.write', $permissions, true)) {
            throw new AccessDeniedException('Member creation and role delegation permissions are required.');
        }
    }
}
