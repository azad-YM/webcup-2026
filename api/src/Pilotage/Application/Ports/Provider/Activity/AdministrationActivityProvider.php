<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Activity;

use Pilotage\Application\DTO\Activity\AdministrationActivity;

/** Activity dashboard (F50): Agents and municipal services. Implemented by Administration. Counts only, never personal data. */
interface AdministrationActivityProvider
{
    public function administrationActivity(): AdministrationActivity;
}
