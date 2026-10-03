<?php

declare(strict_types=1);

namespace Tests\Pilotage\Doubles\Provider;

use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;

final readonly class StubPilotageAccessPolicy implements PilotageAccessPolicy
{
    public function __construct(private bool $allowed = true) {}

    public function canReadWebcupFeed(): bool
    {
        return $this->allowed;
    }
}
