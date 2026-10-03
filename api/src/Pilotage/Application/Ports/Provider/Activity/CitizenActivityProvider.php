<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Activity;

use Pilotage\Application\DTO\Activity\CitizenActivity;

/** Activity dashboard (F50): Citizens and their requests. Implemented by Citizen. Counts only, never personal data. */
interface CitizenActivityProvider
{
    public function citizenActivity(\DateTimeImmutable $since): CitizenActivity;
}
