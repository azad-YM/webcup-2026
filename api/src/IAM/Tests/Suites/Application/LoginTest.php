<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Application;

use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[\PHPUnit\Framework\Attributes\Group('Application')]
final class LoginTest extends ApplicationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
    }

    public function test_shouldAuthenticatePersistedUser(): void
    {
        $this->load([new UserFixture()]);
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'test-password']);
        self::assertResponseIsSuccessful();
        $response = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertNotEmpty($response['token']);
        self::$client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $response['token']);
        $this->request('GET', '/api/iam/me');
        self::assertResponseStatusCodeSame(200);
        $profile = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('user@example.com', $profile['email']);
    }

    public function test_shouldRejectWrongPassword(): void
    {
        $this->load([new UserFixture()]);
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'wrong']);
        self::assertResponseStatusCodeSame(401);
    }

    public function test_shouldStartWithEmptyDatabase(): void
    {
        $this->request('POST', '/api/login_check', ['email' => 'user@example.com', 'password' => 'test-password']);
        self::assertResponseStatusCodeSame(401);
    }
}
