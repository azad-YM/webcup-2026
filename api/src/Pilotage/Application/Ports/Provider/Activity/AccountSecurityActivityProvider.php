<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Activity;

use Pilotage\Application\DTO\Activity\AccountSecurityActivity;

/** Activity dashboard (F50): Accounts and login protection. Implemented by IAM. Counts only, never personal data. */
interface AccountSecurityActivityProvider
{
    public function accountSecurityActivity(\DateTimeImmutable $since): AccountSecurityActivity;
}
