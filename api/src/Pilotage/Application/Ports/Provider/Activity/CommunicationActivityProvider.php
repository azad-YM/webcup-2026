<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Activity;

use Pilotage\Application\DTO\Activity\CommunicationActivity;

/** Activity dashboard (F50): Alerts and publications. Implemented by Communication. Counts only, never personal data. */
interface CommunicationActivityProvider
{
    public function communicationActivity(\DateTimeImmutable $now): CommunicationActivity;
}
