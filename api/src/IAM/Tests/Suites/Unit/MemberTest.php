<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Domain\Entity\Member;
use IAM\Domain\Event\MemberCreated;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('Unit')]
final class MemberTest extends TestCase
{
    public function test_creationRecordsItsEventOnlyOnce(): void
    {
        $member = Member::create('member-id', 'account-id', 'Member', ['role-id']);

        self::assertEquals([new MemberCreated('member-id', 'account-id', ['role-id'])], $member->pullDomainEvents());
        self::assertSame([], $member->pullDomainEvents());
    }

    public function test_reconstitutionDoesNotRecordCreation(): void
    {
        $member = new Member('member-id', 'account-id', 'Member', ['role-id']);

        self::assertSame([], $member->pullDomainEvents());
    }
}
