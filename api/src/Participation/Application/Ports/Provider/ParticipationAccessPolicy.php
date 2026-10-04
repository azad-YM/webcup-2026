<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Provider;

/**
 * Rights of the agents, implemented by Administration
 * (`Administration/Infrastructure/Adapter/Participation/AdminParticipationAccessPolicy`):
 * `admin.participation.read` to read the management lists, `admin.participation.write` to change anything.
 */
interface ParticipationAccessPolicy
{
    public function canRead(): bool;

    public function canWrite(): bool;
}
