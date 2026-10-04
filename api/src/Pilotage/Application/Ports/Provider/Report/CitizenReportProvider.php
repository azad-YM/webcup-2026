<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Report;

use Pilotage\Application\DTO\Report\RequestReport;
use Pilotage\Application\DTO\Report\ServiceUsage;

/** F98, F103 : usages des services et demandes sur une période. Implémenté par Citizen ; comptes seulement. */
interface CitizenReportProvider
{
    /** @return list<ServiceUsage> services ayant au moins un usage sur `[$from, $to[` */
    public function serviceUsage(\DateTimeImmutable $from, \DateTimeImmutable $to): array;

    public function requestReport(\DateTimeImmutable $from, \DateTimeImmutable $to): RequestReport;
}
