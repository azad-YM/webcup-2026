<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListAppointmentDay;

/** Journée de rendez-vous des agents (`date` locale `Y-m-d`, aujourd'hui par défaut). */
final readonly class ListAppointmentDayQuery
{
    public function __construct(public ?string $date = null, public bool $reveal = false) {}
}
