<?php

declare(strict_types=1);

namespace IAM\Application\Command\RegisterUser;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

final readonly class RegisterUserCommandHandler
{
    public function __construct(
        private IUserRepository $users,
        private UserPasswordHasherInterface $hasher,
    ) {
    }

    public function __invoke(RegisterUserCommand $command): void
    {
        $user = new User(Uuid::v7()->toRfc4122(), strtolower($command->email), '');
        $hashedUser = User::create(
            $user->getId(), 
            $user->getUserIdentifier(), 
            $this->hasher->hashPassword($user, $command->plainPassword), 
            $command->name
        );

        $this->users->save($hashedUser);
    }
}
