<?php

declare(strict_types=1);

namespace Administration\Application\Command\AddMember;

use Administration\Application\Ports\Provider\MemberAccountProvisioner;
use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Application\Service\MemberRoleAssignmentPolicy;
use Administration\Domain\Entity\Member;
use Administration\Application\Ports\Repository\IRoleRepository;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\AuditTrail;
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
        private ?AuditTrail $audit = null,
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
        $this->audit?->record('administration.member.added', 'member', $member->id, sprintf('Membre « %s » ajouté avec le(s) rôle(s) %s.', trim($cmd->name), implode(', ', $cmd->roleIds)), ['userId' => $userId, 'roleIds' => array_values($cmd->roleIds)]);

        return ['id' => $member->id, 'userId' => $userId];
    }
}
