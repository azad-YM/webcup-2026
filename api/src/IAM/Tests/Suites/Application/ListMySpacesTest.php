<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Application;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use Administration\Domain\Entity\Role;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class ListMySpacesTest extends ApplicationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
    }

    public function testListsAdminSpaceAfterCredentialsLogin(): void
    {
        $this->load([new UserFixture()]);
        $this->persistMember('test-user', true);
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'test-password']);
        self::assertResponseIsSuccessful();
        $response = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $response['token']);
        $this->assertSpaces([[
            'code' => 'admin',
            'name' => 'Administration',
            'description' => 'Gérez les comptes, les rôles et les modules de l’application.',
            'roles' => ['Administrateur', 'Gestionnaire'],
        ]]);
    }

    public function testReturnsNoSpacesForInactiveMember(): void
    {
        $user = new UserFixture();
        $this->load([$user]);
        $this->persistMember('test-user', false);
        $user->authenticate(self::$client);
        $this->assertSpaces([]);
    }

    public function testCannotSelectAnotherAccountThroughQueryParameters(): void
    {
        $user = new UserFixture();
        $this->load([$user, new UserFixture('other-user', 'other@example.com')]);
        $this->persistMember('other-user', true);
        $user->authenticate(self::$client);
        $this->assertSpaces([], '/api/iam/me/spaces?userId=other-user');
    }

    public function testRejectsAnonymousRequest(): void
    {
        $this->request('GET', '/api/iam/me/spaces');
        self::assertResponseStatusCodeSame(401);
    }

    public function testRejectsInvalidToken(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer invalid');
        $this->request('GET', '/api/iam/me/spaces');
        self::assertResponseStatusCodeSame(401);
    }

    private function persistMember(string $userId, bool $active): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Role('admin', 'Administrateur', []));
        $manager->persist(new Role('manager', 'Gestionnaire', []));
        $manager->persist(new Role('unassigned', 'Auditeur', []));
        $manager->persist(new Member('member-' . $userId, $userId, 'Member', ['admin', 'manager'], $active));
        $manager->flush();
        $manager->clear();
    }

    private function assertSpaces(array $expected, string $uri = '/api/iam/me/spaces'): void
    {
        $this->request('GET', $uri);
        self::assertResponseStatusCodeSame(200);
        self::assertSame($expected, json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR));
    }
}
