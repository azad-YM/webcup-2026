<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Unit\Command;

use Citizen\Application\Command\UpdateMyCitizenProfile\UpdateMyCitizenProfileCommand;
use Citizen\Application\Command\UpdateMyCitizenProfile\UpdateMyCitizenProfileHandler;
use Citizen\Application\ViewModel\CitizenProfile;
use Citizen\Domain\Entity\Citizen;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\NotFoundException;
use Tests\Citizen\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Citizen\Doubles\Repository\RamCitizenRepository;

#[Group('Unit')]
final class UpdateMyCitizenProfileTest extends TestCase
{
    private UpdateMyCitizenProfileHandler $handler;
    private RamCitizenRepository $citizens;
    private StubCurrentAccountProvider $identity;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootHandler();
    }

    public function test_shouldUpdateTheConnectedCitizenProfile(): void
    {
        $profile = $this->execute($this->makeCommand());
        $citizen = $this->citizens->findByUserId('account-id');

        self::assertSame('Ada', $citizen->firstName());
        self::assertSame('Lovelace', $citizen->lastName());
        self::assertSame('0262 00 00 00', $citizen->phone());
        self::assertSame('1 rue du Port', $citizen->address());
        self::assertSame('Sud', $citizen->district());
        self::assertSame('fr', $citizen->preferredLanguage());
        self::assertSame('citizen-id', $profile->id);
        self::assertTrue($profile->profileCompleted);
        self::assertSame('2026-10-03T14:30:00+00:00', $profile->registeredAt);
    }

    public function test_shouldComputeProfileCompletedFromFirstNameLastNameAndDistrict(): void
    {
        self::assertFalse($this->execute($this->makeCommand(['district' => null]))->profileCompleted);
        self::assertFalse($this->execute($this->makeCommand(['firstName' => null]))->profileCompleted);
        self::assertTrue($this->execute($this->makeCommand(['phone' => null, 'address' => null, 'preferredLanguage' => null]))->profileCompleted);
    }

    public function test_shouldReplaceProfileAndStoreBlankValuesAsNull(): void
    {
        $this->execute($this->makeCommand());
        $profile = $this->execute(new UpdateMyCitizenProfileCommand(firstName: '  Grace  ', lastName: '   '));

        self::assertSame('Grace', $profile->firstName);
        self::assertNull($profile->lastName);
        self::assertNull($profile->district);
        self::assertNull($profile->phone);
        self::assertFalse($profile->profileCompleted);
    }

    public function test_shouldOnlyUpdateTheCitizenOfTheConnectedAccount(): void
    {
        $this->identity->id = 'other-account';
        $this->execute($this->makeCommand(['firstName' => 'Other']));

        self::assertNull($this->citizens->findByUserId('account-id')->firstName());
        self::assertSame('Other', $this->citizens->findByUserId('other-account')->firstName());
    }

    public function test_shouldRejectAccountWithoutCitizenProfile(): void
    {
        $this->identity->id = 'unknown-account';
        $saves = $this->citizens->saves;
        $this->expectException(NotFoundException::class);
        try {
            $this->execute($this->makeCommand());
        } finally {
            self::assertSame($saves, $this->citizens->saves);
        }
    }

    public function test_shouldNotRecordEventOnProfileUpdate(): void
    {
        $this->execute($this->makeCommand());

        self::assertSame([], $this->citizens->events);
    }

    private function bootHandler(): void
    {
        $this->citizens = new RamCitizenRepository();
        $registeredAt = new \DateTimeImmutable('2026-10-03T14:30:00+00:00');
        $this->citizens->save(new Citizen('citizen-id', 'account-id', $registeredAt));
        $this->citizens->save(new Citizen('other-citizen', 'other-account', $registeredAt));
        $this->identity = new StubCurrentAccountProvider('account-id');
        $this->handler = new UpdateMyCitizenProfileHandler($this->citizens, $this->identity);
    }

    private function makeCommand(array $override = []): UpdateMyCitizenProfileCommand
    {
        return new UpdateMyCitizenProfileCommand(...array_merge([
            'firstName' => 'Ada',
            'lastName' => 'Lovelace',
            'phone' => '0262 00 00 00',
            'address' => '1 rue du Port',
            'district' => 'Sud',
            'preferredLanguage' => 'fr',
        ], $override));
    }

    private function execute(UpdateMyCitizenProfileCommand $command): CitizenProfile
    {
        return ($this->handler)($command);
    }
}
