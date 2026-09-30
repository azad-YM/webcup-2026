<?php

declare(strict_types=1);

namespace IAM\Application\Command\CreateAccount;

use IAM\Application\Exception\EmailAlreadyUsed;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsMessageHandler]
final readonly class CreateAccountHandler
{
    public function __construct(private IUserRepository $users, private UserPasswordHasherInterface $hasher, private IIdProvider $ids) {}

    public function __invoke(#[\SensitiveParameter] CreateAccountCommand $cmd): string
    {
        $email = strtolower(trim($cmd->email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255 || trim($cmd->name) === '') {
            throw new \DomainException('A valid email and name are required.');
        }
        if (strlen($cmd->password) < 8 || strlen($cmd->password) > 72) {
            throw new \DomainException('The initial password must contain between 8 and 72 bytes.');
        }
        if ($this->users->findByEmail($email) !== null) {
            throw new EmailAlreadyUsed('An account already exists for this email.');
        }
        $user = new User($this->ids->getId(), $email, '', trim($cmd->name));
        $user->setPassword($this->hasher->hashPassword($user, $cmd->password));
        $this->users->save($user);

        return $user->getId();
    }
}
