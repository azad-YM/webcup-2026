<?php

declare(strict_types=1);

namespace Participation\Application\Command\EraseParticipantData;

use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\IdeaRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Contributions and ideas of the citizen are erased; the aggregated results lose the erased answers. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class EraseParticipantDataHandler
{
    public function __construct(private ContributionRepository $contributions, private IdeaRepository $ideas) {}

    public function __invoke(EraseParticipantDataCommand $cmd): void
    {
        $this->contributions->eraseByCitizen($cmd->citizenId);
        $this->ideas->eraseByCitizen($cmd->citizenId);
    }
}
