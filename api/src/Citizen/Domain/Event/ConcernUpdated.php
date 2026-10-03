<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

/** Un agent a pris en compte une inquiétude d'un citoyen ou y a répondu. */
final readonly class ConcernUpdated implements DomainEvent
{
    public function __construct(public string $concernId, public string $citizenId, public string $reference, public string $status) {}
}
