<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use Administration\Application\Cli\BootstrapAdminCommand;
use IAM\Domain\Entity\User;
use PHPUnit\Framework\Attributes\Group;
use Administration\Domain\Entity\Role;
use Administration\Infrastructure\Service\BootstrapAdminService;
use Symfony\Component\Console\Tester\CommandTester;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class BootstrapAdminTest extends ApplicationTestCase
{
    protected function setUp(): void { parent::setUp(); $this->initialize(); }

    public function testCliCreatesPrincipalAndCanBeRepeatedWithoutChangingPassword(): void
    {
        $command = new CommandTester(self::getContainer()->get(BootstrapAdminCommand::class));
        self::assertSame(0, $command->execute([]));
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->clear();
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'admin@example.com']);
        self::assertNotNull($user);
        $hash = $user->getPassword();
        self::assertNotSame('password', $hash);
        self::assertSame(0, $command->execute(['--password' => 'different-password']));
        $manager->clear();
        self::assertCount(1, $manager->getRepository(User::class)->findAll());
        self::assertCount(1, $manager->getRepository(Member::class)->findAll());
        self::assertCount(1, $manager->getRepository(Role::class)->findAll());
        self::assertSame($hash, $manager->getRepository(User::class)->findOneBy(['email' => 'admin@example.com'])->getPassword());
        $member = $manager->getRepository(Member::class)->findOneBy(['userId' => $user->getId()]);
        self::assertTrue($member->active);
        self::assertSame([BootstrapAdminService::ROLE_ID], $member->roleIds);
        self::assertCount(4, $manager->find(Role::class, BootstrapAdminService::ROLE_ID)->permissions);
        $this->request('POST', '/api/login_check', ['email' => 'admin@example.com', 'password' => 'password']);
        self::assertResponseStatusCodeSame(200);
        $token = json_decode(self::$client->getResponse()->getContent(), true)['token'];
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->request('GET', '/api/iam/me/spaces');
        self::assertResponseStatusCodeSame(200);
        self::assertSame('admin', json_decode(self::$client->getResponse()->getContent(), true)[0]['code']);
    }
}
