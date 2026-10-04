<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Participation;

use Citizen\Application\Query\GetMyCitizenProfile\GetMyCitizenProfileHandler;
use Citizen\Application\Query\GetMyCitizenProfile\GetMyCitizenProfileQuery;
use Participation\Application\DTO\Participant;
use Participation\Application\Ports\Provider\ParticipantProvider;
use Shared\Domain\Exception\NotFoundException;

/** Participation asks Citizen which citizen is connected (identifier only; null if the account is not a citizen). */
final readonly class CitizenParticipantProvider implements ParticipantProvider
{
    public function __construct(private GetMyCitizenProfileHandler $profile) {}

    public function current(): ?Participant
    {
        try {
            return new Participant(($this->profile)(new GetMyCitizenProfileQuery())->id);
        } catch (NotFoundException) {
            return null;
        }
    }
}
