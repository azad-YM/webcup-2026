<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Service;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Domain\Entity\User;
use Administration\Application\Ports\Repository\IPermissionRepository;
use Shared\Application\Ports\Service\IIdProvider;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** Explicit cross-module exception for CLI provisioning only, outside application workflows. */
final readonly class BootstrapAdminService
{
    public const ROLE_ID = 'principal-administrator';
    public const AGENT_ROLE_ID = 'municipal-agent';
    public const AGENT_ROLE_NAME = 'Agent municipal';
    /** Reference permissions of the municipal agent: Webcup feed and activity dashboard (L6/L13), requests (L2), contents and alerts (L3/L7), participation (L19), citizen accounts (L8), action journal without login security entries (L12). */
    public const AGENT_PERMISSIONS = ['admin.pilotage.read', 'admin.request.read', 'admin.request.write', 'admin.service.write', 'admin.communication.write', 'admin.participation.read', 'admin.participation.write', 'admin.citizen.read', 'admin.citizen.write', 'admin.audit.read'];

    public function __construct(
        private EntityManagerInterface $manager,
        private IPermissionRepository $permissions,
        private UserPasswordHasherInterface $hasher,
        private IIdProvider $ids,
    ) {}

    /** @return array{userId: string, memberId: string, permissions: int} */
    public function initialize(string $email, #[\SensitiveParameter] string $password): array
    {
        $email = strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
            throw new \InvalidArgumentException('A valid email is required.');
        }
        if (strlen($password) < 8 || strlen($password) > 72) {
            throw new \InvalidArgumentException('The initial password must contain between 8 and 72 bytes.');
        }

        return $this->manager->wrapInTransaction(function () use ($email, $password): array {
            $name = 'Administrateur principal';
            $user = $this->manager->getRepository(User::class)->findOneBy(['email' => $email]);
            if ($user === null) {
                $user = new User($this->ids->getId(), $email, '', $name);
                $user->setPassword($this->hasher->hashPassword($user, $password));
                $this->manager->persist($user);
            }
            $member = $this->manager->getRepository(Member::class)->findOneBy(['userId' => $user->getId()]);
            if ($member !== null && (!$member->active || !in_array(self::ROLE_ID, $member->roleIds, true))) {
                throw new \DomainException('This account already has a different or inactive administration membership.');
            }
            $role = $this->manager->find(Role::class, self::ROLE_ID)
                ?? new Role(self::ROLE_ID, $name, []);
            $catalog = $this->permissions->findAllPermissions();
            $role->update($name, $catalog);
            $this->manager->persist($role);
            $this->ensureAgentRole($catalog);
            if ($member === null) {
                $member = new Member($this->ids->getId(), $user->getId(), $name, [$role->id]);
                $this->manager->persist($member);
            }

            return ['userId' => $user->getId(), 'memberId' => $member->id, 'permissions' => count($role->permissions)];
        });
    }

    /**
     * Reference role assigned by administrators to agents; resynchronized to its reference permissions on each run.
     *
     * @param Permission[] $catalog
     */
    private function ensureAgentRole(array $catalog): void
    {
        $permissions = array_values(array_filter($catalog, static fn (Permission $permission): bool => in_array($permission->key(), self::AGENT_PERMISSIONS, true)));
        if (count($permissions) !== count(self::AGENT_PERMISSIONS)) {
            throw new \LogicException('The municipal agent permissions must exist in the administration catalog.');
        }
        $role = $this->manager->find(Role::class, self::AGENT_ROLE_ID) ?? new Role(self::AGENT_ROLE_ID, self::AGENT_ROLE_NAME, []);
        $role->update(self::AGENT_ROLE_NAME, $permissions);
        $this->manager->persist($role);
    }
}
