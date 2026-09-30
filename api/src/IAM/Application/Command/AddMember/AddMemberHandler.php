<?php

declare(strict_types=1);

namespace IAM\Application\Command\AddMember;

use IAM\Application\Ports\Provider\MemberAccountProvisioner;
use IAM\Application\Ports\Repository\MemberRepository;
use IAM\Application\Service\MemberRoleAssignmentPolicy;
use IAM\Domain\Entity\Member;
use Shared\Application\Ports\Repository\IRoleRepository;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class AddMemberHandler
{
    public function __construct(
        private MemberRepository $members,
        private IRoleRepository $roles,
        private MemberAccountProvisioner $accounts,
        private MemberRoleAssignmentPolicy $authorization,
        private IIdProvider $ids,
    ) {}

    public function __invoke(#[\SensitiveParameter] AddMemberCommand $cmd): array
    {
        $this->authorization->assertAllowed();
        if ($cmd->roleIds === [] || count(array_unique($cmd->roleIds)) !== count($cmd->roleIds)) {
            throw new \DomainException('At least one role is required, without duplicates.');
        }
        foreach ($cmd->roleIds as $roleId) {
            try {
                $role = $this->roles->findByIdOrFail($roleId);
            } catch (NotFoundException) {
                throw new \DomainException('Unknown role: ' . $roleId);
            }
            foreach ($role->permissions as $permission) {
                if ($permission->context !== 'admin') {
                    throw new \DomainException('Only administration roles can be assigned.');
                }
            }
        }
        $userId = $this->accounts->create($cmd->email, trim($cmd->name), $cmd->password);
        $member = Member::create($this->ids->getId(), $userId, trim($cmd->name), array_values($cmd->roleIds));
        $this->members->save($member);

        return ['id' => $member->id, 'userId' => $userId];
    }
}
