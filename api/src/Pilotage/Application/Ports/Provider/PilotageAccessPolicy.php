<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider;

/** Decides whether the connected account may follow the contest feed. Implemented by the BC that owns the agents. */
interface PilotageAccessPolicy
{
    public function canReadWebcupFeed(): bool;
}
