<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Exception\AccountCreationRejected;
use IAM\Application\Command\CreateAccount\CreateAccountHandler;
use IAM\Domain\Entity\User;
use IAM\Infrastructure\Adapter\Citizen\IAMCitizenAccountProvisioner;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasher;
use Tests\IAM\Doubles\Repository\InMemoryUserRepository;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class CitizenAccountProvisionerTest extends TestCase
{
    private InMemoryUserRepository $users;
    private IAMCitizenAccountProvisioner $provisioner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->users = new InMemoryUserRepository();
        $hasher = new UserPasswordHasher(new PasswordHasherFactory([User::class => ['algorithm' => 'bcrypt', 'cost' => 4]]));
        $this->provisioner = new IAMCitizenAccountProvisioner(new CreateAccountHandler($this->users, $hasher, new SequenceIdProvider(['account-id', 'second-id'])));
    }

    public function test_shouldCreateAccountNamedAfterEmailLocalPart(): void
    {
        self::assertSame('account-id', $this->provisioner->create('Jane.Doe@Example.com', 'Initial-password-123'));
        $user = $this->users->findByEmail('jane.doe@example.com');
        self::assertNotNull($user);
        self::assertSame('Jane.Doe', $user->getName());
    }

    public function test_shouldTranslateUsedEmailToCitizenContract(): void
    {
        $this->provisioner->create('jane@example.com', 'Initial-password-123');
        $this->expectException(AccountAlreadyExists::class);
        $this->provisioner->create('JANE@example.com', 'Another-password-456');
    }

    public function test_shouldTranslateRejectedCredentialsToCitizenContract(): void
    {
        $this->expectException(AccountCreationRejected::class);
        try {
            $this->provisioner->create('jane@example.com', 'short');
        } finally {
            self::assertNull($this->users->findByEmail('jane@example.com'));
        }
    }
}
