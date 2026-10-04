<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Report;

use Pilotage\Application\DTO\Report\CommunicationReport;

/** F103 : alertes et publications diffusées sur une période. Implémenté par Communication. */
interface CommunicationReportProvider
{
    public function communicationReport(\DateTimeImmutable $from, \DateTimeImmutable $to): CommunicationReport;
}
