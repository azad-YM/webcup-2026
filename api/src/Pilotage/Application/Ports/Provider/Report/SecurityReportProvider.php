<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Report;

use Pilotage\Application\DTO\Report\SecurityReport;

/** F103 : connexions bloquées et comptes suspendus. Implémenté par IAM ; jamais d'adresse ni d'e-mail. */
interface SecurityReportProvider
{
    public function securityReport(\DateTimeImmutable $from, \DateTimeImmutable $to): SecurityReport;
}
