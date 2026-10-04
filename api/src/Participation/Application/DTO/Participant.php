<?php

declare(strict_types=1);

namespace Participation\Application\DTO;

/** Contract of `ParticipantProvider`: the citizen identifier only, never the account or the profile. */
final readonly class Participant
{
    public function __construct(public string $citizenId) {}
}
