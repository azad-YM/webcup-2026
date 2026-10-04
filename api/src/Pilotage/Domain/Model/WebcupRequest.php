<?php

declare(strict_types=1);

namespace Pilotage\Domain\Model;

/** One city need broadcast by the Webcup API. `requestCode` is its stable identifier. */
final readonly class WebcupRequest
{
    public function __construct(
        public string $requestCode,
        public ?string $requesterName,
        public ?string $requesterType,
        public ?string $messagePublic,
        public ?string $difficulty,
        public ?int $difficultyLevel,
        public int $xpBase,
        public int $xpTimeBonus,
        public int $xpTotal,
        public ?int $xpAvailable,
        public bool $isInitial,
        public ?int $waveNumber,
        /** Delay since the start of the contest (`02:00:00` = H+2), not a time of day. */
        public ?string $arrivalTime,
        public ?string $groupName,
        public bool $isAiRequest,
        public ?int $sortOrder,
    ) {}
}
