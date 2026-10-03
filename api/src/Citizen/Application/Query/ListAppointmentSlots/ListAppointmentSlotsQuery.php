<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListAppointmentSlots;

/** Offre de rendez-vous : services ayant des créneaux libres, et créneaux libres du service choisi. */
final readonly class ListAppointmentSlotsQuery
{
    public function __construct(public ?string $serviceId = null) {}
}
