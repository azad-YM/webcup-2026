<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Service;

use Shared\Application\Ports\Service\IClock;

final readonly class FixedClock implements IClock
{
    private \DateTimeImmutable $now;

    public function __construct(?\DateTimeImmutable $now = null)
    {
        $this->now = $now ?? new \DateTimeImmutable('2026-10-03T14:30:00+00:00');
    }

    public function now(): \DateTimeImmutable { return $this->now; }
}
