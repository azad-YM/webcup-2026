<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Application;

use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;
#[Group('Application')]
final class LoginProtectionTest extends ApplicationTestCase
{
    protected function setUp(): void { parent::setUp(); $this->initialize(); $this->load([new UserFixture()]); }
    public function testSixthAttemptIsThrottledEvenWithCorrectPasswordThenRecovers(): void
    {
        for ($i = 0; $i < 5; ++$i) {
            $this->request('POST', '/api/login_check', ['email' => ' USER@example.com ', 'password' => 'wrong']); self::assertResponseStatusCodeSame(401);
        }
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'test-password']); self::assertResponseStatusCodeSame(429);
        self::assertGreaterThan(0, (int) self::$client->getResponse()->headers->get('Retry-After'));
        self::getContainer()->get(EntityManagerInterface::class)->getConnection()->executeStatement('UPDATE iam_login_attempt_buckets SET expires_at = 0');
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'test-password']); self::assertResponseStatusCodeSame(200);
    }
    public function testUnknownAccountHasSameThrottleAndError(): void
    {
        for ($i = 0; $i < 6; ++$i) $this->request('POST', '/api/login_check', ['email' => 'unknown@example.com', 'password' => 'wrong']);
        self::assertResponseStatusCodeSame(429);
    }
    public function testMalformedCredentialsDoNotCauseServerErrors(): void
    {
        $this->request('POST', '/api/login_check', ['email' => ['not scalar'], 'password' => ['bad']]); self::assertResponseStatusCodeSame(401);
    }
}
