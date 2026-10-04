<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class CitizenRegistered implements DomainEvent
{
    public function __construct(
        public string $citizenId,
        public string $userId,
        public \DateTimeImmutable $registeredAt,
    ) {}
}
