<?php

namespace IAM\Application\Command\LoginWithCredentials;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;

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

        $user = $this->repository->findByEmail($email);

        if ($user === null || !$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new BadCredentialsException('Invalid credentials');
        }

        return $user;
    }
}
