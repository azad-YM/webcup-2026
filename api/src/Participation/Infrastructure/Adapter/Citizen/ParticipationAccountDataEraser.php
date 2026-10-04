<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Adapter\Citizen;

use Citizen\Application\Ports\Service\AccountDataEraser;
use Participation\Application\Command\EraseParticipantData\EraseParticipantDataCommand;
use Participation\Application\Command\EraseParticipantData\EraseParticipantDataHandler;

/**
 * Citizen deletes an account and asks every owner of citizen data to erase it (port `AccountDataEraser`,
 * tag `citizen.account_data_eraser`). Participation erases the contributions and ideas of that citizen,
 * in the deletion transaction.
 */
final readonly class ParticipationAccountDataEraser implements AccountDataEraser
{
    public function __construct(private EraseParticipantDataHandler $erase) {}

    public function erase(string $citizenId): void
    {
        ($this->erase)(new EraseParticipantDataCommand($citizenId));
    }
}
