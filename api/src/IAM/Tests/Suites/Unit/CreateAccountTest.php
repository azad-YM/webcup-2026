<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Application\Command\CreateAccount\CreateAccountCommand;
use IAM\Application\Command\CreateAccount\CreateAccountHandler;
use IAM\Application\Exception\EmailAlreadyUsed;
use IAM\Domain\Entity\User;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasher;
use Tests\IAM\Doubles\Repository\InMemoryUserRepository;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class CreateAccountTest extends TestCase
{
    private InMemoryUserRepository $users;
    private CreateAccountHandler $handler;
    private UserPasswordHasher $hasher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldNormalizeEmailAndHashInitialPassword(): void
    {
        $user = $this->execute($this->makeCommand());
        self::assertSame('account-id', $user->getId());
        self::assertSame('member@example.com', $user->getUserIdentifier());
        self::assertTrue($this->hasher->isPasswordValid($user, 'Initial-password-123'));
        self::assertNotSame('Initial-password-123', $user->getPassword());
    }

    public function test_shouldNeverReplaceExistingPassword(): void
    {
        $existing = $this->execute($this->makeCommand());
        $hash = $existing->getPassword();
        $this->expectException(EmailAlreadyUsed::class);
        try {
            $this->execute($this->makeCommand(['password' => 'Another-password-456']));
        } finally {
            self::assertSame($hash, $existing->getPassword());
        }
    }

    public function test_shouldRejectEmptyPasswordWithoutSaving(): void
    {
        $this->expectException(\DomainException::class);
        try {
            $this->execute($this->makeCommand(['password' => '']));
        } finally {
            self::assertNull($this->users->findByEmail('member@example.com'));
        }
    }

    private function bootHandler(): void
    {
        $this->users = new InMemoryUserRepository();
        $this->hasher = new UserPasswordHasher(new PasswordHasherFactory([User::class => ['algorithm' => 'bcrypt', 'cost' => 4]]));
        $this->handler = new CreateAccountHandler($this->users, $this->hasher, new SequenceIdProvider(['account-id']));
    }

    private function makeCommand(array $override = []): CreateAccountCommand
    {
        return new CreateAccountCommand('Member@Example.com', 'Member', $override['password'] ?? 'Initial-password-123');
    }

    private function execute(CreateAccountCommand $command): User
    {
        ($this->handler)($command);
        return $this->users->findByEmail('member@example.com');
    }
}
