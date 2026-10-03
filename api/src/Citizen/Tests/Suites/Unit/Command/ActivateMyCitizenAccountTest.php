<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Unit\Command;

use Citizen\Application\Command\ActivateMyCitizenAccount\ActivateMyCitizenAccountCommand;
use Citizen\Application\Command\ActivateMyCitizenAccount\ActivateMyCitizenAccountHandler;
use Citizen\Domain\Entity\Citizen;
use Citizen\Domain\Event\CitizenRegistered;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Tests\Citizen\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Citizen\Doubles\Repository\RamCitizenRepository;
use Tests\Citizen\Doubles\Service\FixedClock;
use Tests\Shared\Doubles\Service\SequenceIdProvider;

#[Group('Unit')]
final class ActivateMyCitizenAccountTest extends TestCase
{
    private ActivateMyCitizenAccountHandler $handler;
    private RamCitizenRepository $citizens;

    protected function setUp(): void
    {
        parent::setUp();
        $this->citizens = new RamCitizenRepository();
        $this->handler = new ActivateMyCitizenAccountHandler(
            $this->citizens,
            new StubCurrentAccountProvider('agent-account'),
            new SequenceIdProvider(['citizen-id']),
            new FixedClock(),
        );
    }

    public function test_shouldMakeTheConnectedAccountACitizen(): void
    {
        $profile = ($this->handler)(new ActivateMyCitizenAccountCommand());

        self::assertSame('citizen-id', $profile->id);
        self::assertFalse($profile->profileCompleted);
        self::assertSame('citizen-id', $this->citizens->findByUserId('agent-account')?->id);
        self::assertCount(1, $this->citizens->events);
        self::assertInstanceOf(CitizenRegistered::class, $this->citizens->events[0]);
    }

    public function test_shouldReturnTheExistingProfileWithoutDuplicate(): void
    {
        $existing = new Citizen('existing-id', 'agent-account', new \DateTimeImmutable('2026-10-03T10:00:00+00:00'));
        $existing->updateProfile('Ada', 'Lovelace', null, null, 'Sud', null);
        $this->citizens->save($existing);
        $this->citizens->saves = 0;

        $profile = ($this->handler)(new ActivateMyCitizenAccountCommand());

        self::assertSame('existing-id', $profile->id);
        self::assertTrue($profile->profileCompleted);
        self::assertSame(0, $this->citizens->saves);
        self::assertSame([], $this->citizens->events);
    }
}
