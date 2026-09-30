<?php

declare(strict_types=1);

namespace IAM\Application\Query\GetMemberSpaceAccess;

use IAM\Application\Ports\Repository\MemberRepository;
use IAM\Application\DTO\MemberSpaceAccess;
use Shared\Application\Ports\Repository\IRoleRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMemberSpaceAccessHandler
{
    public function __construct(private MemberRepository $members, private IRoleRepository $roles) {}

    public function __invoke(GetMemberSpaceAccessQuery $query): ?MemberSpaceAccess
    {
        $member = $this->members->findByUserId($query->userId);
        if ($member === null || !$member->active) {
            return null;
        }

        $roles = [];
        foreach ($member->roleIds as $roleId) {
            $roles[] = $this->roles->findByIdOrFail($roleId)->name;
        }

        return new MemberSpaceAccess($roles);
    }
}
