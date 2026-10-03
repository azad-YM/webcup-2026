<?php

declare(strict_types=1);

namespace Pilotage\Domain\Model;

/** State of the contest session as published by the Webcup API. */
final readonly class WebcupSession
{
    public function __construct(
        public ?string $status,
        public bool $isRunning,
        public ?int $currentWave,
        public ?int $elapsedMinutes,
        public ?int $visibleRequestsCount,
        public ?int $nextWaveNumber,
        /** `0` when no wave is left. */
        public ?int $minutesUntilNextWave,
    ) {}

    public function hasNextWave(): bool
    {
        return $this->nextWaveNumber !== null && ($this->minutesUntilNextWave ?? 0) > 0;
    }
}
