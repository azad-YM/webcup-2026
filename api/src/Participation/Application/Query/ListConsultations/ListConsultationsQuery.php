<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListConsultations;

/** Published consultations, optionally filtered by phase (upcoming, open, closed). */
final readonly class ListConsultationsQuery
{
    public function __construct(public ?string $phase = null) {}
}
