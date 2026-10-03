<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

/** Rendez-vous pris, déplacé ou annulé (`status` : `confirmed` | `cancelled`). */
final readonly class AppointmentChanged implements DomainEvent
{
    public function __construct(public string $appointmentId, public string $citizenId, public string $status) {}
}
