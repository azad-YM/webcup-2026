<?php

namespace IAM\Application\Command\LoginWithCredentials;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;

final class LoginWithCredentialsHandler
{
    public function __construct(
        private readonly IUserRepository $repository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function __invoke(?string $email, ?string $password): User
    {
        if ($email === null || $email === '' || $password === null || $password === '') {
            throw new BadCredentialsException('Invalid credentials');
        }

        $user = $this->repository->findByEmail(strtolower(trim($email)));

        if ($user === null || $user->status() === 'deleted' || !$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new BadCredentialsException('Invalid credentials');
        }
        // Revealed only after a valid password: no account enumeration.
        if (!$user->isActive()) {
            throw new CustomUserMessageAccountStatusException('Votre compte est suspendu par la mairie. Contactez l’accueil de la mairie pour en connaître la raison.');
        }

        return $user;
    }
}
