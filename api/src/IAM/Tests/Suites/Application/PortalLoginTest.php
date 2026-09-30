<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Application;

use IAM\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Domain\Entity\PortalLoginCode;
use IAM\Domain\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Shared\Infrastructure\Service\BootstrapAdminService;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class PortalLoginTest extends ApplicationTestCase
{
    private const VERIFIER = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    private string $siteToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        self::getContainer()->get(BootstrapAdminService::class)->initialize('admin@example.com', 'password');
        $this->request('POST', '/api/login_check', ['email' => 'admin@example.com', 'password' => 'password']);
        self::assertResponseStatusCodeSame(200);
        $this->siteToken = $this->body()['token'];
    }

    public function testSiteToAdminLoginAndReplayProtection(): void
    {
        $code = $this->issue();
        $this->exchange($code);
        self::assertResponseStatusCodeSame(200);
        $token = $this->body()['token'];
        $jwt = self::getContainer()->get(JWTTokenManagerInterface::class);
        self::assertSame(['admin'], (array) $jwt->parse($token)['aud']);
        self::assertSame($jwt->parse($this->siteToken)['exp'], $jwt->parse($token)['exp']);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->request('GET', '/api/iam/me');
        self::assertResponseStatusCodeSame(200);
        self::assertSame('admin@example.com', $this->body()['email']);
        self::assertSame('admin', $this->body()['spaces'][0]['code']);
        $this->request('GET', '/api/iam/permissions');
        self::assertResponseStatusCodeSame(200);
        self::assertCount(6, $this->body());
        $this->exchange($code);
        self::assertResponseStatusCodeSame(403);
    }

    public function testWrongVerifierDoesNotConsumeCode(): void
    {
        $code = $this->issue();
        $this->exchange($code, str_repeat('b', 64));
        self::assertResponseStatusCodeSame(403);
        $this->exchange($code);
        self::assertResponseStatusCodeSame(200);
    }

    public function testWrongDestinationDoesNotConsumeCode(): void
    {
        $code = $this->issue();
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/iam/portal-sessions', ['code' => $code, 'destination' => 'external', 'verifier' => self::VERIFIER]);
        self::assertResponseStatusCodeSame(422);
        $this->exchange($code);
        self::assertResponseStatusCodeSame(200);
    }

    public function testExpiredCodeIsRejected(): void
    {
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'admin@example.com']);
        $code = str_repeat('c', 64);
        $manager->persist(new PortalLoginCode(hash('sha256', $code), $user->getId(), 'admin@example.com', 'admin', $this->challenge(), hash('sha256', $this->siteToken), time() - 1, time() + 300));
        $manager->flush();
        $this->exchange($code);
        self::assertResponseStatusCodeSame(403);
    }

    public function testAccessIsRecheckedWhenCodeIsExchanged(): void
    {
        $code = $this->issue();
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $member = $manager->getRepository(Member::class)->findOneBy([]);
        $manager->remove($member);
        $manager->flush();
        $this->exchange($code);
        self::assertResponseStatusCodeSame(403);
    }

    public function testIssuanceRequiresAuthenticatedAuthorizedSiteSession(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/iam/portal-codes', ['destination' => 'admin', 'challenge' => $this->challenge()]);
        self::assertResponseStatusCodeSame(401);
        $code = $this->issue();
        $this->exchange($code);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->body()['token']);
        $this->request('POST', '/api/iam/portal-codes', ['destination' => 'admin', 'challenge' => $this->challenge()]);
        self::assertResponseStatusCodeSame(403);
    }

    private function issue(): string
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->siteToken);
        $this->request('POST', '/api/iam/portal-codes', ['destination' => 'admin', 'challenge' => $this->challenge()]);
        self::assertResponseStatusCodeSame(200);
        $code = $this->body()['code'];
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        self::assertNull($manager->find(PortalLoginCode::class, $code));
        self::assertNotNull($manager->find(PortalLoginCode::class, hash('sha256', $code)));
        return $code;
    }
    private function exchange(string $code, string $verifier = self::VERIFIER): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('POST', '/api/iam/portal-sessions', ['code' => $code, 'destination' => 'admin', 'verifier' => $verifier]);
    }
    private function challenge(): string { return rtrim(strtr(base64_encode(hash('sha256', self::VERIFIER, true)), '+/', '-_'), '='); }
    private function body(): array { return json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR); }
}
