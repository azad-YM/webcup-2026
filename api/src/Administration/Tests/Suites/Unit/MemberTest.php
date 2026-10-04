<?php

declare(strict_types=1);

namespace Tests\Administration\Suites\Unit;

use Administration\Domain\Entity\Member;
use Administration\Domain\Event\MemberCreated;
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
