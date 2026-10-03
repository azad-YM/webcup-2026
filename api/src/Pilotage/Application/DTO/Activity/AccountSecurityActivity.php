<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Activity;

/** Contract of `AccountSecurityActivityProvider`: accounts and login protection, counted by IAM. */
final readonly class AccountSecurityActivity
{
    public function __construct(
        /** Suspended accounts (citizens and agents). */
        public int $suspendedAccounts,
        /** Temporary login lockouts triggered since the period start. */
        public int $blockedLogins,
    ) {}
}
