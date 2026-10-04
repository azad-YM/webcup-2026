<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `CitizenReportProvider::requestReport` (F103) : demandes et habitants sur une période. */
final readonly class RequestReport
{
    public function __construct(
        public int $received,
        public int $resolved,
        public int $rejected,
        /** Encore sans prise en charge à la fin de la période. */
        public int $waiting,
        public int $urgent,
        /** Délai moyen jusqu'à la première prise en charge, en heures (`null` si aucune). */
        public ?float $averageHoursToAcknowledge,
        public int $newCitizens,
        public int $appointments,
        public int $concerns,
    ) {}
}
