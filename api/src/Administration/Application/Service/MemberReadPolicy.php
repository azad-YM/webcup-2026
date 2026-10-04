<?php

declare(strict_types=1);

namespace Administration\Application\Service;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Shared\Domain\Exception\AccessDeniedException;

/** Reading the member list requires `admin.member.read` or `admin.member.write` for an active member. */
final readonly class MemberReadPolicy
{
    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function assertAllowed(): void
    {
        foreach (['admin.member.read', 'admin.member.write'] as $permission) {
            if (($this->permissions)(new CheckCurrentMemberPermissionsQuery([$permission]))) {
                return;
            }
        }
        throw new AccessDeniedException('Member read or write permission is required for an active administration member.');
    }
}
