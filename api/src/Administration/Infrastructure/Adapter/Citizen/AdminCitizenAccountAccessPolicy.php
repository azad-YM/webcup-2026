<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Citizen;

use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Application\Ports\Repository\MemberRepository;
final readonly class AdminCitizenAccountAccessPolicy implements CitizenAccountAccessPolicy
{
    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions, private MemberRepository $members) {}
    public function canReadAccounts(): bool { return ($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.citizen.read'])); }
    public function canManageAccounts(): bool { return ($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.citizen.write'])); }
    public function isProtectedAccount(string $userId): bool { return $this->members->findByUserId($userId)?->active === true; }
}
