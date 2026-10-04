<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class CitizenNotified implements DomainEvent
{
    public function __construct(public string $notificationId, public string $citizenId, public string $kind) {}
}
