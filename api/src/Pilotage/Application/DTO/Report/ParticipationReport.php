<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `ParticipationReportProvider::participationReport` (F103) : participation des habitants sur une période. */
final readonly class ParticipationReport
{
    public function __construct(
        public int $contributions,
        public int $ideas,
        public int $reviews,
        public ?float $averageRating,
    ) {}
}
