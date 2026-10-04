<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListMembers;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Application\Service\MemberReadPolicy;
use Administration\Domain\Entity\Member;
use Administration\Domain\Entity\Role;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMembersHandler
{
    public function __construct(
        private MemberRepository $members,
        private IRoleRepository $roles,
        private MemberReadPolicy $authorization,
    ) {}

    /** @return list<array{id: string, userId: string, name: string, roles: list<array{id: string, name: string}>, active: bool}> */
    public function __invoke(ListMembersQuery $query): array
    {
        $this->authorization->assertAllowed();
        $names = [];
        foreach ($this->roles->findAll() as $role) {
            /** @var Role $role */
            $names[$role->id] = $role->name;
        }

        return array_values(array_map(static fn (Member $member): array => [
            'id' => $member->id,
            'userId' => $member->userId,
            'name' => $member->name,
            // A role deleted since the assignment grants nothing and is not shown.
            'roles' => array_values(array_map(
                static fn (string $roleId): array => ['id' => $roleId, 'name' => $names[$roleId]],
                array_values(array_filter($member->roleIds, static fn (string $roleId): bool => isset($names[$roleId]))),
            )),
            'active' => $member->active,
        ], $this->members->findAll()));
    }
}
