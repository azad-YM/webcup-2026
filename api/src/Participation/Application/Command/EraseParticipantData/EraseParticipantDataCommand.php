<?php

declare(strict_types=1);

namespace Participation\Application\Command\EraseParticipantData;

/**
 * Internal command (no route): the citizen account is being deleted. Called by the adapter
 * `Participation/Infrastructure/Adapter/Citizen/ParticipationAccountDataEraser`, inside the deletion transaction.
 */
final readonly class EraseParticipantDataCommand
{
    public function __construct(public string $citizenId) {}
}
