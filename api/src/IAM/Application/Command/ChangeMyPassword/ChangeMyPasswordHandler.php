<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeMyPassword;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\AccountSessionRevoker;
use IAM\Application\Ports\Service\SiteSessionTokens;
use IAM\Application\Service\CurrentAccount;
use IAM\Application\Service\Outcome;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** F54 : changer son mot de passe (après « Ce n'était pas moi ») ; les autres sessions sont fermées. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeMyPasswordHandler
{
    public function __construct(
        private CurrentAccount $account,
        private IUserRepository $users,
        private UserPasswordHasherInterface $hasher,
        private AccountSessionRevoker $revoker,
        private SiteSessionTokens $sessions,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ChangeMyPasswordCommand $cmd): array
    {
        $user = $this->account->user();
        if (!$this->hasher->isPasswordValid($user, $cmd->currentPassword)) {
            return Outcome::failure(403, 'invalid_password', 'Mot de passe actuel incorrect.');
        }
        if (strlen($cmd->newPassword) < 8 || strlen($cmd->newPassword) > 72) {
            throw new \DomainException('Le nouveau mot de passe doit contenir de 8 à 72 octets.');
        }
        $user->changePasswordHash($this->hasher->hashPassword($user, $cmd->newPassword));
        $this->revoker->revokePortalCodes($user->getId());
        $this->users->save($user);

        return ['token' => $this->sessions->issue($user, $this->sessions->currentDeviceId()), 'changed' => true];
    }
}
