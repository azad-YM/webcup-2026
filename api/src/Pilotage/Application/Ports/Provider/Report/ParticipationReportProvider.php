<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Report;

use Pilotage\Application\DTO\Report\ParticipationReport;
use Pilotage\Application\DTO\Report\ServiceSatisfaction;

/** F98, F103 : avis sur les services et participation sur une période. Implémenté par Participation. */
interface ParticipationReportProvider
{
    /** @return list<ServiceSatisfaction> */
    public function serviceSatisfaction(\DateTimeImmutable $from, \DateTimeImmutable $to): array;

    public function participationReport(\DateTimeImmutable $from, \DateTimeImmutable $to): ParticipationReport;
}
