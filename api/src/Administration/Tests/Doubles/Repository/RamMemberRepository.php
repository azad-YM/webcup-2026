<?php

declare(strict_types=1);

namespace Tests\Administration\Doubles\Repository;

use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Domain\Entity\Member;

final class RamMemberRepository implements MemberRepository
{
    /** @var array<string, Member> */
    private array $members = [];
    /** @var list<\Shared\Domain\Event\DomainEvent> */
    public array $events = [];

    public function save(Member $member): void
    {
        $this->members[$member->userId] = $member;
        array_push($this->events, ...$member->pullDomainEvents());
    }
    public function findByUserId(string $userId): ?Member { return $this->members[$userId] ?? null; }
}
