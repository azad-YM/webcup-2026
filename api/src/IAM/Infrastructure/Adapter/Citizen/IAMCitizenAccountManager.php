<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Citizen;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Command\ChangeAccountStatus\ChangeAccountStatusCommand;
use IAM\Application\Command\ChangeAccountStatus\ChangeAccountStatusHandler;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
final readonly class IAMCitizenAccountManager implements CitizenAccountManager
{
    public function __construct(private IUserRepository $users, private ChangeAccountStatusHandler $changeStatus, private UserPasswordHasherInterface $hasher) {}
    public function email(string $userId): ?string { return $this->users->findById($userId)?->getUserIdentifier(); }
    public function verifyPassword(string $userId, string $password): bool
    {
        $user = $this->users->findById($userId);
        return $user !== null && $user->isActive() && $this->hasher->isPasswordValid($user, $password);
    }
    public function delete(string $userId): void { ($this->changeStatus)(new ChangeAccountStatusCommand($userId, 'deleted')); }
    public function suspend(string $userId, bool $suspended): void { ($this->changeStatus)(new ChangeAccountStatusCommand($userId, $suspended ? 'suspended' : 'active')); }
}
