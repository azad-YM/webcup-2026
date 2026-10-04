<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `CommunicationReportProvider` (F103) : informations diffusées sur une période. */
final readonly class CommunicationReport
{
    public function __construct(
        public int $alerts,
        public int $criticalAlerts,
        public int $publications,
        public int $officialMessages,
    ) {}
}
