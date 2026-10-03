<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Activity;

/** Contract of `CitizenActivityProvider`: citizens and their requests, counted by Citizen. */
final readonly class CitizenActivity
{
    /** @param array<string, int> $requestsByStatus count per request status (`submitted`, `acknowledged`, `in_progress`, `resolved`, `rejected`) */
    public function __construct(
        public int $activeCitizens,
        public int $suspendedCitizens,
        public int $newCitizens,
        public array $requestsByStatus,
        /** Requests not yet taken in charge by an agent (`submitted`). */
        public int $waitingRequests,
        /** Requests still open (`submitted`, `acknowledged`, `in_progress`). */
        public int $openRequests,
        public int $newRequests,
        /** Submission date of the oldest request still waiting, if any. */
        public ?\DateTimeImmutable $oldestWaitingSince,
    ) {}
}
