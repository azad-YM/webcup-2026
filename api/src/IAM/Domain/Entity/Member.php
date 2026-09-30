<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

use IAM\Domain\Event\MemberCreated;
use Shared\Domain\Model\AggregateRoot;

class Member
{
    use AggregateRoot;

    /** @param list<string> $roleIds */
    public function __construct(
        public readonly string $id,
        public readonly string $userId,
        public readonly string $name,
        public readonly array $roleIds,
        public readonly bool $active = true,
    ) {}

    /** @param list<string> $roleIds */
    public static function create(string $id, string $userId, string $name, array $roleIds): self
    {
        $member = new self($id, $userId, $name, $roleIds);
        $member->record(new MemberCreated($member->id, $member->userId, $member->roleIds));

        return $member;
    }
}
