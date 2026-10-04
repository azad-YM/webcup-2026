<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Unit\Command;

use Citizen\Application\Command\RegisterCitizen\RegisterCitizenCommand;
use Citizen\Application\Command\RegisterCitizen\RegisterCitizenHandler;
use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Domain\Entity\Citizen;
use Citizen\Domain\Event\CitizenRegistered;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Tests\Citizen\Doubles\Provider\StubCitizenAccountProvisioner;
use Tests\Citizen\Doubles\Repository\RamCitizenRepository;
use Tests\Citizen\Doubles\Service\FixedClock;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class RegisterCitizenTest extends TestCase
{
    private RegisterCitizenHandler $handler;
    private RamCitizenRepository $citizens;
    private StubCitizenAccountProvisioner $accounts;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldRegisterCitizenLinkedToTheNewAccount(): void
    {
        $result = ($this->handler)($this->makeCommand());
        $citizen = $this->citizens->findByUserId('account-id');

        self::assertSame(['citizenId' => 'citizen-id'], $result);
        self::assertNotNull($citizen);
        self::assertSame('citizen-id', $citizen->id);
        self::assertEquals(new \DateTimeImmutable('2026-10-03T14:30:00+00:00'), $citizen->registeredAt);
        self::assertSame('new@example.com', $this->accounts->receivedEmail);
        self::assertSame('Initial-password-123', $this->accounts->receivedPassword);
    }

    public function test_shouldStartWithAnEmptyOptionalProfile(): void
    {
        $citizen = $this->execute($this->makeCommand());

        self::assertNull($citizen->firstName());
        self::assertNull($citizen->lastName());
        self::assertNull($citizen->district());
        self::assertFalse($citizen->isProfileCompleted());
    }

    public function test_shouldRecordCitizenRegisteredWithoutCredentials(): void
    {
        $citizen = $this->execute($this->makeCommand());

        self::assertCount(1, $this->citizens->events);
        self::assertInstanceOf(CitizenRegistered::class, $this->citizens->events[0]);
        self::assertSame('citizen-id', $this->citizens->events[0]->citizenId);
        self::assertSame('account-id', $this->citizens->events[0]->userId);
        self::assertSame([], $citizen->pullDomainEvents());
        self::assertStringNotContainsString('Initial-password-123', serialize($this->citizens->events));
    }

    public function test_shouldNotRegisterCitizenWhenEmailIsAlreadyUsed(): void
    {
        $this->accounts->emailAlreadyUsed = true;
        $this->expectException(AccountAlreadyExists::class);
        try {
            ($this->handler)($this->makeCommand());
        } finally {
            self::assertSame(0, $this->citizens->saves);
            self::assertSame([], $this->citizens->events);
        }
    }

    public function test_shouldNotExposePasswordInCommandDump(): void
    {
        self::assertStringNotContainsString('Initial-password-123', print_r($this->makeCommand(), true));
    }

    private function bootHandler(): void
    {
        $this->citizens = new RamCitizenRepository();
        $this->accounts = new StubCitizenAccountProvisioner();
        $this->handler = new RegisterCitizenHandler($this->citizens, $this->accounts, new SequenceIdProvider(['citizen-id']), new FixedClock());
    }

    private function makeCommand(array $override = []): RegisterCitizenCommand
    {
        return new RegisterCitizenCommand($override['email'] ?? 'new@example.com', $override['password'] ?? 'Initial-password-123');
    }

    private function execute(RegisterCitizenCommand $command): Citizen
    {
        ($this->handler)($command);
        return $this->citizens->findByUserId('account-id');
    }
}
