<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Unit\Query;

use Citizen\Application\Query\GetMyCitizenProfile\GetMyCitizenProfileHandler;
use Citizen\Application\Query\GetMyCitizenProfile\GetMyCitizenProfileQuery;
use Citizen\Domain\Entity\Citizen;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\NotFoundException;
use Tests\Citizen\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Citizen\Doubles\Repository\RamCitizenRepository;

#[Group('Unit')]
final class GetMyCitizenProfileTest extends TestCase
{
    private GetMyCitizenProfileHandler $handler;
    private StubCurrentAccountProvider $identity;

    protected function setUp(): void
    {
        parent::setUp();
        $citizens = new RamCitizenRepository();
        $citizen = new Citizen('citizen-id', 'account-id', new \DateTimeImmutable('2026-10-03T14:30:00+00:00'));
        $citizen->updateProfile('Ada', null, null, null, null, 'fr');
        $citizens->save($citizen);
        $this->identity = new StubCurrentAccountProvider('account-id');
        $this->handler = new GetMyCitizenProfileHandler($citizens, $this->identity);
    }

    public function test_shouldReturnTheConnectedCitizenProfile(): void
    {
        $profile = ($this->handler)(new GetMyCitizenProfileQuery());

        self::assertSame('citizen-id', $profile->id);
        self::assertSame('Ada', $profile->firstName);
        self::assertNull($profile->lastName);
        self::assertSame('fr', $profile->preferredLanguage);
        self::assertSame('2026-10-03T14:30:00+00:00', $profile->registeredAt);
        self::assertFalse($profile->profileCompleted);
    }

    public function test_shouldRejectAccountWithoutCitizenProfile(): void
    {
        $this->identity->id = 'agent-account';
        $this->expectException(NotFoundException::class);
        ($this->handler)(new GetMyCitizenProfileQuery());
    }
}
