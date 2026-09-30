<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Domain\Entity\User;
use PHPUnit\Framework\TestCase;

#[\PHPUnit\Framework\Attributes\Group('Unit')]
final class UserTest extends TestCase
{
    public function testItAlwaysHasTheUserRole(): void
    {
        $user = new User('user-id', 'user@example.com', 'hash');
        self::assertContains('ROLE_USER', $user->getRoles());
    }
}
