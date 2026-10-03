<?php

declare(strict_types=1);

namespace Administration\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class MemberCreated implements DomainEvent
{
    /** @param list<string> $roleIds */
    public function __construct(public string $memberId, public string $userId, public array $roleIds) {}
}
