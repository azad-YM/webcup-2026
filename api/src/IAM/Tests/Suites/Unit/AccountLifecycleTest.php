<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Domain\Entity\User;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
#[Group('Unit')]
final class AccountLifecycleTest extends TestCase
{
    public function testSuspensionAndReactivationInvalidateEarlierSessionVersions(): void
    {
        $user = new User('user', 'ada@example.com', 'hash');
        $user->setSuspended(true);
        self::assertFalse($user->isActive()); self::assertSame(1, $user->sessionVersion());
        $user->setSuspended(true);
        self::assertSame(1, $user->sessionVersion());
        $user->setSuspended(false);
        self::assertTrue($user->isActive()); self::assertSame(2, $user->sessionVersion());
    }
    public function testDeletionErasesCredentialsAndCannotBeReversed(): void
    {
        $user = new User('user', 'ada@example.com', 'hash', 'Ada');
        $user->deleteAccount();
        self::assertSame('user@deleted.invalid', $user->getUserIdentifier());
        self::assertNull($user->getName()); self::assertSame('!deleted', $user->getPassword());
        self::assertFalse($user->isActive());
        $this->expectException(\DomainException::class);
        $user->setSuspended(false);
    }
}
