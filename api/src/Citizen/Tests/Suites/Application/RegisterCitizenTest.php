<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Application;

use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;
use Citizen\Domain\Event\CitizenRegistered;
use Citizen\Infrastructure\Doctrine\Repository\DoctrineCitizenRepository;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\IUserRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\DependencyInjection\ServiceLocator;
use Symfony\Component\Messenger\Bridge\Doctrine\Transport\Connection as TransportConnection;
use Symfony\Component\Messenger\Bridge\Doctrine\Transport\DoctrineTransport;
use Symfony\Component\Messenger\MessageBus;
use Symfony\Component\Messenger\Middleware\SendMessageMiddleware;
use Symfony\Component\Messenger\Transport\Sender\SendersLocator;
use Symfony\Component\Messenger\Transport\Serialization\PhpSerializer;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Tests\Citizen\Doubles\Service\FailingCitizenFlushListener;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;
use Zenstruck\Messenger\Test\InteractsWithMessenger;

#[Group('Application')]
final class RegisterCitizenTest extends ApplicationTestCase
{
    use InteractsWithMessenger;

    private const URI = '/api/citizen/register';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $this->load([new UserFixture()]);
    }

    public function test_shouldRegisterAnonymousVisitorAsCitizenWithUsableAccount(): void
    {
        $this->register();

        self::assertResponseStatusCodeSame(200);
        $result = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame(['citizenId'], array_keys($result));
        $user = self::getContainer()->get(IUserRepository::class)->findByEmail('new.citizen@example.com');
        self::assertNotNull($user);
        self::assertSame('new.citizen', $user->getName());
        self::assertTrue(self::getContainer()->get(UserPasswordHasherInterface::class)->isPasswordValid($user, 'Initial-password-123'));
        $citizen = self::getContainer()->get(CitizenRepository::class)->findByUserId($user->getId());
        self::assertNotNull($citizen);
        self::assertSame($result['citizenId'], $citizen->id);
        self::assertFalse($citizen->isProfileCompleted());

        $this->request('POST', '/api/login_check', ['email' => 'new.citizen@example.com', 'password' => 'Initial-password-123']);
        self::assertResponseStatusCodeSame(200);
        $token = json_decode(self::$client->getResponse()->getContent(), true)['token'];
        self::assertNotEmpty($token);

        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
        $this->request('GET', '/api/citizen/me');
        self::assertResponseStatusCodeSame(200);
        self::assertSame($result['citizenId'], json_decode(self::$client->getResponse()->getContent(), true)['id']);
    }

    public function test_shouldPublishCitizenRegisteredOnAsyncWithoutCredentials(): void
    {
        $this->register();

        self::assertResponseStatusCodeSame(200);
        $this->transport('async')->queue()->assertContains(CitizenRegistered::class, 1);
        $events = $this->transport('async')->queue()->messages();
        self::assertStringNotContainsString('Initial-password-123', serialize($events));
        self::assertStringNotContainsString('new.citizen@example.com', serialize($events));
    }

    public function test_shouldRejectAlreadyUsedEmailWithConflictAndCreateNothing(): void
    {
        $hash = self::getContainer()->get(IUserRepository::class)->findByEmail('user@example.com')->getPassword();

        $this->register(['email' => 'USER@example.com']);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('An account already exists for this email.', json_decode(self::$client->getResponse()->getContent(), true)['message']);
        self::assertSame($hash, self::getContainer()->get(IUserRepository::class)->findByEmail('user@example.com')->getPassword());
        self::assertSame(1, $this->rowCount('auth_users'));
        self::assertSame(0, $this->rowCount('citizens'));
        $this->transport('async')->queue()->assertEmpty();
    }

    public function test_shouldRejectSecondRegistrationWithSameEmail(): void
    {
        $this->register();
        self::assertResponseStatusCodeSame(200);

        $this->register(['password' => 'Another-password-456']);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(2, $this->rowCount('auth_users'));
        self::assertSame(1, $this->rowCount('citizens'));
        $this->transport('async')->queue()->assertCount(1);
    }

    /** @return iterable<string, array{array<string, mixed>}> */
    public static function invalidPayloads(): iterable
    {
        yield 'invalid email' => [['email' => 'not-an-email']];
        yield 'missing email' => [['email' => null]];
        yield 'short password' => [['password' => 'short']];
        yield 'password over 72 bytes' => [['password' => str_repeat('é', 37)]];
        yield 'missing password' => [['password' => null]];
    }

    #[DataProvider('invalidPayloads')]
    public function test_shouldRejectInvalidPayloadWithoutCreation(array $override): void
    {
        $payload = array_filter(array_merge(self::payload(), $override), static fn ($value) => $value !== null);
        $this->request('POST', self::URI, $payload);

        self::assertResponseStatusCodeSame(422);
        $this->assertNoCreation();
    }

    public function test_shouldRollbackAccountCitizenAndEventIfFinalFlushFails(): void
    {
        self::$client->disableReboot();
        self::$client->catchExceptions(false);
        $transport = $this->useDoctrineEventBus();
        self::getContainer()->get(EntityManagerInterface::class)->getEventManager()->addEventListener(['onFlush'], new FailingCitizenFlushListener());
        try {
            $this->register();
            self::fail('The final flush should fail.');
        } catch (\RuntimeException $exception) {
            self::assertSame('Citizen flush failed', $exception->getMessage());
        }
        self::assertSame(1, $this->rowCount('auth_users'));
        self::assertSame(0, $this->rowCount('citizens'));
        self::assertSame(0, $transport->getMessageCount());
    }

    public function test_shouldPersistEventInTheSameDatabaseAsTheCitizen(): void
    {
        self::$client->disableReboot();
        $transport = $this->useDoctrineEventBus();

        $this->register();

        self::assertResponseStatusCodeSame(200);
        self::assertSame(1, $transport->getMessageCount());
        $events = iterator_to_array($transport->all());
        self::assertInstanceOf(CitizenRegistered::class, $events[0]->getMessage());
    }

    private function useDoctrineEventBus(): DoctrineTransport
    {
        $connection = self::getContainer()->get(EntityManagerInterface::class)->getConnection();
        $transport = new DoctrineTransport(new TransportConnection([
            'table_name' => 'citizen_events_test', 'queue_name' => 'citizens', 'auto_setup' => false,
        ], $connection), new PhpSerializer());
        $transport->setup();
        $connection->executeStatement('DELETE FROM citizen_events_test');
        $bus = new MessageBus([new SendMessageMiddleware(new SendersLocator(
            [CitizenRegistered::class => ['doctrine']],
            new ServiceLocator(['doctrine' => static fn () => $transport]),
        ))]);
        self::getContainer()->set(CitizenRepository::class, new DoctrineCitizenRepository(self::getContainer()->get(EntityManagerInterface::class), $bus));

        return $transport;
    }

    /** @return array<string, string> */
    private static function payload(): array
    {
        return ['email' => 'new.citizen@example.com', 'password' => 'Initial-password-123'];
    }

    private function register(array $override = []): void
    {
        $this->request('POST', self::URI, array_merge(self::payload(), $override));
    }

    private function rowCount(string $table): int
    {
        return (int) self::getContainer()->get(EntityManagerInterface::class)->getConnection()->fetchOne('SELECT COUNT(*) FROM ' . $table);
    }

    private function assertNoCreation(): void
    {
        self::assertSame(1, $this->rowCount('auth_users'));
        self::assertCount(0, self::getContainer()->get(EntityManagerInterface::class)->getRepository(Citizen::class)->findAll());
        $this->transport('async')->queue()->assertEmpty();
    }
}
