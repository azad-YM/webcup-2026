<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Provider;

use Participation\Application\DTO\Participant;

/**
 * Citizen identity of the connected account, implemented by Citizen
 * (`Citizen/Infrastructure/Adapter/Participation/CitizenParticipantProvider`).
 * Returns null when the account is anonymous or not a citizen (an agent without citizen profile, for instance).
 */
interface ParticipantProvider
{
    public function current(): ?Participant;
}
