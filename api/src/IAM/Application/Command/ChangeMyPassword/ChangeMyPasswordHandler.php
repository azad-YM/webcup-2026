<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeMyPassword;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * F71: replaces the secret of the connected account after checking the current one, and lifts the
 * first-login obligation of a resident account. The current session stays valid.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeMyPasswordHandler
{
    public function __construct(
        private IAuthenticatedUserProvider $identity,
        private IUserRepository $users,
        private UserPasswordHasherInterface $hasher,
    ) {}

    /** @return array{passwordChangeRequired: false} */
    public function __invoke(#[\SensitiveParameter] ChangeMyPasswordCommand $cmd): array
    {
        $user = $this->users->findById($this->identity->getUser()->getId()) ?? throw new NotFoundException('Account not found.');
        if (!$this->hasher->isPasswordValid($user, $cmd->currentPassword)) {
            throw new DomainException('Le code actuel est incorrect.');
        }
        if ($cmd->newPassword === $cmd->currentPassword) {
            throw new DomainException('Choisissez un nouveau code différent du code provisoire.');
        }
        $user->changePassword($this->hasher->hashPassword($user, $cmd->newPassword));
        $this->users->save($user);

        return ['passwordChangeRequired' => false];
    }
}
