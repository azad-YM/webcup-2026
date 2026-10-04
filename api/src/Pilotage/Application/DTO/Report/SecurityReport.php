<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `SecurityReportProvider` (F103) : sécurité des comptes sur une période, comptes seulement. */
final readonly class SecurityReport
{
    public function __construct(
        public int $blockedLogins,
        public int $suspendedAccounts,
    ) {}
}
