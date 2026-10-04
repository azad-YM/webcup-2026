<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Application;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Member;
use Administration\Domain\VO\Permission;
use Administration\Infrastructure\InMemory\InMemoryAdminPermissionRepository;
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
        self::assertCount(2, $manager->getRepository(Role::class)->findAll());
        self::assertSame($hash, $manager->getRepository(User::class)->findOneBy(['email' => 'admin@example.com'])->getPassword());
        $member = $manager->getRepository(Member::class)->findOneBy(['userId' => $user->getId()]);
        self::assertTrue($member->active);
        self::assertSame([BootstrapAdminService::ROLE_ID], $member->roleIds);
        $this->assertReferenceRoles();
        $this->request('POST', '/api/login_check', ['email' => 'admin@example.com', 'password' => 'password']);
        self::assertResponseStatusCodeSame(200);
        $token = json_decode(self::$client->getResponse()->getContent(), true)['token'];
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->request('GET', '/api/iam/me/spaces');
        self::assertResponseStatusCodeSame(200);
        self::assertSame('admin', json_decode(self::$client->getResponse()->getContent(), true)[0]['code']);
    }

    public function testCliResynchronizesTheMunicipalAgentRoleAndItCanBeAssigned(): void
    {
        $roles = self::getContainer()->get(IRoleRepository::class);
        $roles->save(new Role(BootstrapAdminService::AGENT_ROLE_ID, 'Renamed', [new Permission('admin', 'role', 'write')]));
        $command = new CommandTester(self::getContainer()->get(BootstrapAdminCommand::class));
        self::assertSame(0, $command->execute([]));
        self::getContainer()->get(EntityManagerInterface::class)->clear();
        $this->assertReferenceRoles();

        $this->request('POST', '/api/login_check', ['email' => 'admin@example.com', 'password' => 'password']);
        $token = json_decode(self::$client->getResponse()->getContent(), true)['token'];
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->request('POST', '/api/administration/members', [
            'name' => 'Agent', 'email' => 'agent@example.com', 'password' => 'Agent-password-123', 'roleIds' => [BootstrapAdminService::AGENT_ROLE_ID],
        ]);
        self::assertResponseStatusCodeSame(200);
        $this->request('GET', '/api/administration/members');
        self::assertResponseStatusCodeSame(200);
        $agent = array_values(array_filter(json_decode(self::$client->getResponse()->getContent(), true), static fn (array $member): bool => $member['name'] === 'Agent'));
        self::assertSame([['id' => BootstrapAdminService::AGENT_ROLE_ID, 'name' => 'Agent municipal']], $agent[0]['roles']);

        // The agent role does not grant member administration.
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/login_check', ['email' => 'agent@example.com', 'password' => 'Agent-password-123']);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.json_decode(self::$client->getResponse()->getContent(), true)['token']);
        $this->request('GET', '/api/administration/members');
        self::assertResponseStatusCodeSame(403);
    }

    private function assertReferenceRoles(): void
    {
        $roles = self::getContainer()->get(IRoleRepository::class);
        $catalog = self::getContainer()->get(InMemoryAdminPermissionRepository::class)->findAllPermissions();
        self::assertSame($this->keys($catalog), $this->keys($roles->findByIdOrFail(BootstrapAdminService::ROLE_ID)->permissions));
        $agent = $roles->findByIdOrFail(BootstrapAdminService::AGENT_ROLE_ID);
        self::assertSame('Agent municipal', $agent->name);
        self::assertSame(['admin.pilotage.read'], $this->keys($agent->permissions));
    }

    /** @param Permission[] $permissions @return list<string> */
    private function keys(array $permissions): array
    {
        return array_values(array_map(static fn (Permission $permission): string => $permission->key(), $permissions));
    }
}
