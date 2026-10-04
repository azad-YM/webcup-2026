<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Application;

use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;
use Zenstruck\Messenger\Test\InteractsWithMessenger;

#[Group('Application')]
final class CitizenProfileTest extends ApplicationTestCase
{
    use InteractsWithMessenger;

    private const URI = '/api/citizen/me';

    private UserFixture $citizenAccount;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $this->citizenAccount = new UserFixture('citizen-user', 'citizen@example.com');
        $this->load([$this->citizenAccount, new UserFixture('other-user', 'other@example.com'), new UserFixture('agent-user', 'agent@example.com')]);
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Citizen('citizen-id', 'citizen-user', new \DateTimeImmutable('2026-10-03T14:30:00+00:00')));
        $manager->persist(new Citizen('other-citizen', 'other-user', new \DateTimeImmutable('2026-10-03T15:00:00+00:00')));
        $manager->flush();
        $manager->clear();
        $this->citizenAccount->authenticate(self::$client);
    }

    public function test_shouldReturnCitizenProfileView(): void
    {
        $this->request('GET', self::URI);

        self::assertResponseStatusCodeSame(200);
        self::assertSame([
            'id' => 'citizen-id',
            'firstName' => null,
            'lastName' => null,
            'phone' => null,
            'address' => null,
            'district' => null,
            'preferredLanguage' => null,
            'registeredAt' => '2026-10-03T14:30:00+00:00',
            'profileCompleted' => false,
        ], $this->response());
    }

    public function test_shouldRejectAnonymousProfileRead(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('GET', self::URI);

        self::assertResponseStatusCodeSame(401);
    }

    public function test_shouldReturnNotFoundForAccountWithoutCitizenProfile(): void
    {
        $this->authenticate('agent-user', 'agent@example.com');
        $this->request('GET', self::URI);

        self::assertResponseStatusCodeSame(404);
    }

    public function test_shouldUpdateProfileAndComputeCompletion(): void
    {
        $this->updateProfile();

        self::assertResponseStatusCodeSame(200);
        $profile = $this->response();
        self::assertSame('citizen-id', $profile['id']);
        self::assertSame('Ada', $profile['firstName']);
        self::assertSame('Sud', $profile['district']);
        self::assertSame('fr', $profile['preferredLanguage']);
        self::assertTrue($profile['profileCompleted']);
        $citizen = $this->citizen('citizen-user');
        self::assertSame('Lovelace', $citizen->lastName());
        self::assertSame('0262 00 00 00', $citizen->phone());
        self::assertSame('1 rue du Port', $citizen->address());

        $this->request('GET', self::URI);
        self::assertSame($profile, $this->response());
        $this->transport('async')->queue()->assertEmpty();
    }

    public function test_shouldKeepProfileIncompleteWithoutDistrict(): void
    {
        $this->updateProfile(['district' => null]);

        self::assertResponseStatusCodeSame(200);
        self::assertFalse($this->response()['profileCompleted']);
        self::assertNull($this->citizen('citizen-user')->district());
    }

    public function test_shouldIgnoreIdentityFieldsFromPayload(): void
    {
        $this->updateProfile(['id' => 'other-citizen', 'userId' => 'other-user']);

        self::assertResponseStatusCodeSame(200);
        self::assertSame('citizen-id', $this->response()['id']);
        self::assertSame('Ada', $this->citizen('citizen-user')->firstName());
        self::assertNull($this->citizen('other-user')->firstName());
    }

    /** @return iterable<string, array{array<string, mixed>}> */
    public static function invalidPayloads(): iterable
    {
        yield 'first name too long' => [['firstName' => str_repeat('a', 101)]];
        yield 'last name too long' => [['lastName' => str_repeat('a', 101)]];
        yield 'phone too long' => [['phone' => str_repeat('0', 31)]];
        yield 'address too long' => [['address' => str_repeat('a', 256)]];
        yield 'district too long' => [['district' => str_repeat('a', 101)]];
        yield 'language too long' => [['preferredLanguage' => 'french']];
        yield 'not a string' => [['firstName' => ['Ada']]];
    }

    #[DataProvider('invalidPayloads')]
    public function test_shouldRejectInvalidProfileWithoutPersistence(array $override): void
    {
        $this->updateProfile($override);

        self::assertResponseStatusCodeSame(422);
        $citizen = $this->citizen('citizen-user');
        self::assertNull($citizen->firstName());
        self::assertNull($citizen->lastName());
        self::assertNull($citizen->district());
    }

    public function test_shouldRejectAnonymousProfileUpdate(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->updateProfile();

        self::assertResponseStatusCodeSame(401);
        self::assertNull($this->citizen('citizen-user')->firstName());
    }

    public function test_shouldReturnNotFoundWhenNonCitizenUpdatesProfile(): void
    {
        $this->authenticate('agent-user', 'agent@example.com');
        $this->updateProfile();

        self::assertResponseStatusCodeSame(404);
        self::assertCount(2, self::getContainer()->get(EntityManagerInterface::class)->getRepository(Citizen::class)->findAll());
    }

    public function test_shouldActivateCitizenProfileForAnExistingAccount(): void
    {
        $this->authenticate('agent-user', 'agent@example.com');
        $this->request('POST', '/api/citizen/me/activate');

        self::assertResponseStatusCodeSame(200);
        self::assertFalse($this->response()['profileCompleted']);
        self::assertNotNull(self::getContainer()->get(CitizenRepository::class)->findByUserId('agent-user'));
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(200);
    }

    public function test_shouldKeepActivationIdempotentForACitizen(): void
    {
        $this->request('POST', '/api/citizen/me/activate');

        self::assertResponseStatusCodeSame(200);
        self::assertSame('citizen-id', $this->response()['id']);
    }

    public function test_shouldRejectAnonymousActivation(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/citizen/me/activate');

        self::assertResponseStatusCodeSame(401);
    }

    private function authenticate(string $id, string $email): void
    {
        $account = new UserFixture($id, $email);
        $account->load(self::getContainer());
        self::getContainer()->get(EntityManagerInterface::class)->clear();
        $account->authenticate(self::$client);
    }

    private function updateProfile(array $override = []): void
    {
        $this->request('PUT', self::URI, array_merge([
            'firstName' => 'Ada',
            'lastName' => 'Lovelace',
            'phone' => '0262 00 00 00',
            'address' => '1 rue du Port',
            'district' => 'Sud',
            'preferredLanguage' => 'fr',
        ], $override));
    }

    private function citizen(string $userId): Citizen
    {
        return self::getContainer()->get(CitizenRepository::class)->findByUserId($userId);
    }

    /** @return array<string, mixed> */
    private function response(): array
    {
        return json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
    }
}
