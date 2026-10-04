<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `ParticipationReportProvider::serviceSatisfaction` (F98) : avis déposés sur un service. */
final readonly class ServiceSatisfaction
{
    public function __construct(
        public string $serviceId,
        public int $reviews,
        /** Note moyenne sur 5, `null` sans avis. */
        public ?float $averageRating,
        /** Part des avis « besoin satisfait » (0 à 1), `null` sans avis. */
        public ?float $needMetShare,
    ) {}
}
