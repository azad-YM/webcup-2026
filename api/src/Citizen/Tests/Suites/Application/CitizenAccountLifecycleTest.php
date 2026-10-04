<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Application;

use Administration\Domain\Entity\Member;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Citizen\Domain\Entity\Citizen;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Domain\Entity\User;
use IAM\Domain\Entity\PortalLoginCode;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class CitizenAccountLifecycleTest extends ApplicationTestCase
{
    private string $citizenToken;
    private string $agentToken;
    protected function setUp(): void
    {
        parent::setUp(); $this->initialize();
        $this->load([new UserFixture('citizen-user', 'citizen@example.com'), new UserFixture('agent-user', 'agent@example.com')]);
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $citizen = new Citizen('citizen', 'citizen-user', new \DateTimeImmutable());
        $citizen->updateProfile('Ada', 'Lovelace', '123', 'Street', 'Nord', 'fr');
        $em->persist($citizen);
        $em->persist(new Role('manager', 'Manager', [new Permission('admin', 'citizen', 'read'), new Permission('admin', 'citizen', 'write')]));
        $em->persist(new Member('member', 'agent-user', 'Agent', ['manager']));
        $em->flush();
        $jwt = self::getContainer()->get(JWTTokenManagerInterface::class);
        $this->citizenToken = $jwt->createFromPayload($em->find(User::class, 'citizen-user'), ['aud' => 'site']);
        $this->agentToken = $jwt->createFromPayload($em->find(User::class, 'agent-user'), ['aud' => 'admin']);
        $this->asCitizen();
    }
    public function testDeleteAnonymizesBothOwnersAndRevokesBothAudiences(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $adminToken = self::getContainer()->get(JWTTokenManagerInterface::class)->createFromPayload($em->find(User::class, 'citizen-user'), ['aud' => 'admin']);
        $this->request('DELETE', '/api/citizen/me', ['password' => 'test-password', 'userId' => 'agent-user']);
        self::assertResponseStatusCodeSame(200);
        $em = self::getContainer()->get(EntityManagerInterface::class);
        self::assertSame('deleted', $em->find(User::class, 'citizen-user')->status());
        self::assertSame('citizen-user@deleted.invalid', $em->find(User::class, 'citizen-user')->getUserIdentifier());
        self::assertNull($em->find(Citizen::class, 'citizen')->phone());
        self::assertTrue($em->find(User::class, 'agent-user')->isActive());
        $this->request('GET', '/api/iam/me'); self::assertResponseStatusCodeSame(401);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$adminToken);
        $this->request('GET', '/api/iam/me'); self::assertResponseStatusCodeSame(401);
        $this->request('POST', '/api/login_check', ['email' => 'citizen@example.com', 'password' => 'test-password']); self::assertResponseStatusCodeSame(401);
        $this->asAgent(); $this->request('GET', '/api/citizen/accounts');
        self::assertSame([], $this->response()['items']);
    }
    public function testWrongPasswordRefusesDeletionAndLeavesSessionUsable(): void
    {
        $this->request('DELETE', '/api/citizen/me', ['password' => 'wrong']); self::assertResponseStatusCodeSame(403);
        $this->request('GET', '/api/citizen/me'); self::assertResponseStatusCodeSame(200);
        self::assertSame('Ada', $this->response()['firstName']);
    }
    public function testSuspensionRevokesExistingSessionsAndCodesAndReactivationRequiresNewLogin(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $em->persist(new PortalLoginCode(str_repeat('a', 64), 'citizen-user', 'citizen@example.com', 'admin', 'challenge', 'session', time()+60, time()+300)); $em->flush();
        $this->asAgent();
        $this->request('PUT', '/api/citizen/accounts/suspension', ['citizenId' => 'citizen', 'suspended' => true]); self::assertResponseStatusCodeSame(200);
        self::assertSame([], self::getContainer()->get(EntityManagerInterface::class)->getRepository(PortalLoginCode::class)->findAll());
        $this->asCitizen(); $this->request('GET', '/api/citizen/me'); self::assertResponseStatusCodeSame(401);
        $this->request('POST', '/api/login_check', ['email' => 'citizen@example.com', 'password' => 'test-password']); self::assertResponseStatusCodeSame(401);
        $this->asAgent(); $this->request('PUT', '/api/citizen/accounts/suspension', ['citizenId' => 'citizen', 'suspended' => false]); self::assertResponseStatusCodeSame(200);
        $this->asCitizen(); $this->request('GET', '/api/citizen/me'); self::assertResponseStatusCodeSame(401);
        $this->request('POST', '/api/login_check', ['email' => 'citizen@example.com', 'password' => 'test-password']); self::assertResponseStatusCodeSame(200);
    }
    public function testCitizenCannotListOrSuspendAccounts(): void
    {
        $this->request('GET', '/api/citizen/accounts'); self::assertResponseStatusCodeSame(403);
        $this->request('PUT', '/api/citizen/accounts/suspension', ['citizenId' => 'citizen', 'suspended' => true]); self::assertResponseStatusCodeSame(403);
    }
    public function testActiveMemberCannotBeDeletedOrSuspended(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $em->persist(new Member('protected-member', 'citizen-user', 'Shared', ['manager'])); $em->flush();
        $this->request('DELETE', '/api/citizen/me', ['password' => 'test-password']); self::assertResponseStatusCodeSame(409);
        $this->asAgent(); $this->request('PUT', '/api/citizen/accounts/suspension', ['citizenId' => 'citizen', 'suspended' => true]); self::assertResponseStatusCodeSame(409);
        $this->request('GET', '/api/citizen/accounts'); self::assertResponseStatusCodeSame(200);
        self::assertFalse($this->response()['items'][0]['canSuspend']);
    }
    public function testAnonymousCannotDeleteAndInvalidPayloadIsRejected(): void
    {
        $this->request('DELETE', '/api/citizen/me', ['password' => '']); self::assertResponseStatusCodeSame(422);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('DELETE', '/api/citizen/me', ['password' => 'test-password']); self::assertResponseStatusCodeSame(401);
    }
    private function asCitizen(): void { self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->citizenToken); }
    private function asAgent(): void { self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->agentToken); }
    private function response(): array { return json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR); }
}
