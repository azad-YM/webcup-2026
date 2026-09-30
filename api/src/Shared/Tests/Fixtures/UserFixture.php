<?php

declare(strict_types=1);

namespace Tests\Shared\Fixtures;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Domain\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Container\ContainerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

// Used by IAM tests and authenticated scenarios in other BCs.
final class UserFixture implements Fixture
{
    private User $user;

    public function __construct(
        private readonly string $id = 'test-user',
        private readonly string $email = 'user@example.com',
        private readonly string $password = 'test-password',
    ) {}

    public function load(ContainerInterface $container): void
    {
        $identity = new User($this->id, $this->email, '');
        $hash = $container->get(UserPasswordHasherInterface::class)->hashPassword($identity, $this->password);
        $this->user = new User($this->id, $this->email, $hash);
        $container->get(EntityManagerInterface::class)->persist($this->user);
    }

    public function authenticate(KernelBrowser $client): void
    {
        $jwt = $client->getContainer()->get(JWTTokenManagerInterface::class)->create($this->user);
        $client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $jwt);
    }
}
