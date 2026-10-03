<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Domain\Entity\Member;
use Administration\Domain\Event\MemberCreated;
use Administration\Infrastructure\Doctrine\Repository\DoctrineMemberRepository;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\IUserRepository;
use PHPUnit\Framework\Attributes\Group;
use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Messenger\Bridge\Doctrine\Transport\DoctrineTransport;
use Symfony\Component\Messenger\Bridge\Doctrine\Transport\Connection as TransportConnection;
use Symfony\Component\Messenger\Transport\Serialization\PhpSerializer;
use Symfony\Component\Messenger\MessageBus;
use Symfony\Component\Messenger\Middleware\SendMessageMiddleware;
use Symfony\Component\Messenger\Transport\Sender\SendersLocator;
use Symfony\Component\DependencyInjection\ServiceLocator;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Administration\Doubles\Service\FailingMemberFlushListener;
use Zenstruck\Messenger\Test\InteractsWithMessenger;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class AddMemberTest extends ApplicationTestCase
{
    use InteractsWithMessenger;

    private const URI = '/api/administration/members';

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
        $roles = self::getContainer()->get(IRoleRepository::class);
        $roles->save(Role::create('admin-role', 'Admin', [new Permission('admin', 'member', 'write'), new Permission('admin', 'role-assignment', 'write')]));
        $roles->save(Role::create('reader-role', 'Reader', [new Permission('admin', 'role', 'read')]));
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member('admin-member', 'test-user', 'Admin', ['admin-role']));
        $manager->flush();
    }

    public function test_shouldPersistMemberRolesAndUsableAccount(): void
    {
        $this->addMember();
        self::assertResponseStatusCodeSame(200);
        $result = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        $user = self::getContainer()->get(IUserRepository::class)->findByEmail('new@example.com');
        self::assertNotNull($user);
        self::assertSame($user->getId(), $result['userId']);
        self::assertTrue(self::getContainer()->get(UserPasswordHasherInterface::class)->isPasswordValid($user, 'Initial-password-123'));
        $member = self::getContainer()->get(MemberRepository::class)->findByUserId($user->getId());
        self::assertNotNull($member);
        self::assertSame($result['id'], $member->id);
        self::assertSame(['reader-role'], $member->roleIds);
        $this->transport('async')->queue()->assertContains(MemberCreated::class, 1);
        $events = $this->transport('async')->queue()->messages();
        self::assertSame([], $member->pullDomainEvents());
        self::getContainer()->get(MemberRepository::class)->save($member);
        $this->transport('async')->queue()->assertCount(1);
        self::assertStringNotContainsString('Initial-password-123', serialize($events));
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/login_check', ['email' => 'new@example.com', 'password' => 'Initial-password-123']);
        self::assertResponseStatusCodeSame(200);
        self::assertNotEmpty(json_decode(self::$client->getResponse()->getContent(), true)['token']);
    }

    public function test_shouldRejectUnknownRoleWithoutCreatingAccount(): void
    {
        $this->addMember(['roleIds' => ['unknown']]);
        self::assertResponseStatusCodeSame(422);
        $this->assertNoCreation();
    }

    public function test_shouldRejectInvalidPayload(): void
    {
        $this->addMember(['password' => '']);
        self::assertResponseStatusCodeSame(422);
        $this->assertNoCreation();
    }

    public function test_shouldRejectExistingEmailWithoutReplacingPassword(): void
    {
        $user = self::getContainer()->get(IUserRepository::class)->findByEmail('user@example.com');
        $hash = $user->getPassword();
        $this->addMember(['email' => 'USER@example.com']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame($hash, self::getContainer()->get(IUserRepository::class)->findByEmail('user@example.com')->getPassword());
        $this->assertNoCreation();
    }

    public function test_shouldRejectAnonymousRequest(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->addMember();
        self::assertResponseStatusCodeSame(401);
        $this->assertNoCreation();
    }

    public function test_shouldRejectActorWithoutDelegationPermission(): void
    {
        $roles = self::getContainer()->get(IRoleRepository::class);
        $role = $roles->findByIdOrFail('admin-role');
        $role->update('Admin', [new Permission('admin', 'member', 'write')]);
        $roles->save($role);
        $this->addMember();
        self::assertResponseStatusCodeSame(403);
        $this->assertNoCreation();
    }

    public function test_shouldRejectAccountWithoutAdminMembership(): void
    {
        $outsider = new UserFixture('outsider', 'outsider@example.com');
        $this->load([$outsider]);
        $outsider->authenticate(self::$client);
        $this->addMember();
        self::assertResponseStatusCodeSame(403);
        $this->assertNoCreation();
    }

    public function test_shouldRejectRoleFromAnotherContext(): void
    {
        self::getContainer()->get(IRoleRepository::class)->save(Role::create('foreign-role', 'Foreign', [new Permission('external', 'role', 'read')]));
        $this->addMember(['roleIds' => ['foreign-role']]);
        self::assertResponseStatusCodeSame(422);
        $this->assertNoCreation();
    }

    public function test_shouldRollbackAccountMemberAndEventIfFinalFlushFails(): void
    {
        self::$client->disableReboot();
        self::$client->catchExceptions(false);
        $transport = $this->useDoctrineEventBus();
        self::getContainer()->get(EntityManagerInterface::class)->getEventManager()->addEventListener(['onFlush'], new FailingMemberFlushListener());
        try {
            $this->addMember();
            self::fail('The final flush should fail.');
        } catch (\RuntimeException $exception) {
            self::assertSame('Member flush failed', $exception->getMessage());
        }
        $connection = self::getContainer()->get(EntityManagerInterface::class)->getConnection();
        self::assertSame(1, (int) $connection->fetchOne('SELECT COUNT(*) FROM admin_members'));
        self::assertSame(1, (int) $connection->fetchOne('SELECT COUNT(*) FROM auth_users'));
        self::assertSame(0, $transport->getMessageCount());
    }

    public function test_shouldPersistEventInTheSameDatabaseAsTheMember(): void
    {
        self::$client->disableReboot();
        $transport = $this->useDoctrineEventBus();
        $this->addMember();
        self::assertResponseStatusCodeSame(200);
        self::assertSame(1, $transport->getMessageCount());
        $events = iterator_to_array($transport->all());
        self::assertInstanceOf(MemberCreated::class, $events[0]->getMessage());
        self::assertStringNotContainsString('Initial-password-123', serialize($events));
    }

    private function useDoctrineEventBus(): DoctrineTransport
    {
        $connection = self::getContainer()->get(EntityManagerInterface::class)->getConnection();
        $transport = new DoctrineTransport(new TransportConnection([
            'table_name' => 'member_events_test', 'queue_name' => 'members', 'auto_setup' => false,
        ], $connection), new PhpSerializer());
        $transport->setup();
        $connection->executeStatement('DELETE FROM member_events_test');
        $bus = new MessageBus([new SendMessageMiddleware(new SendersLocator(
            [MemberCreated::class => ['doctrine']],
            new ServiceLocator(['doctrine' => static fn () => $transport]),
        ))]);
        self::getContainer()->set(MemberRepository::class, new DoctrineMemberRepository(self::getContainer()->get(EntityManagerInterface::class), $bus));
        return $transport;
    }

    private function addMember(array $override = []): void
    {
        $this->request('POST', self::URI, array_merge([
            'name' => 'New Member', 'email' => 'new@example.com', 'password' => 'Initial-password-123', 'roleIds' => ['reader-role'],
        ], $override));
    }

    private function assertNoCreation(): void
    {
        self::assertNull(self::getContainer()->get(IUserRepository::class)->findByEmail('new@example.com'));
        self::assertCount(1, self::getContainer()->get(EntityManagerInterface::class)->getRepository(Member::class)->findAll());
        $this->transport('async')->queue()->assertEmpty();
    }
}
