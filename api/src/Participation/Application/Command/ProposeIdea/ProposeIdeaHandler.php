<?php

declare(strict_types=1);

namespace Participation\Application\Command\ProposeIdea;

use Participation\Application\Ports\Provider\DistrictDirectory;
use Participation\Application\Ports\Provider\ParticipantProvider;
use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Domain\Entity\Idea;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** The response is the acknowledgement: reference IDE-…, date, status « received ». */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ProposeIdeaHandler
{
    public function __construct(
        private ParticipantProvider $participants,
        private IdeaRepository $ideas,
        private DistrictDirectory $districts,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ProposeIdeaCommand $cmd): array
    {
        $participant = $this->participants->current() ?? throw new NotFoundException('Le compte connecté n’est pas un compte citoyen.');
        $district = $cmd->district === null || trim($cmd->district) === '' ? null : trim($cmd->district);
        if ($district !== null && !$this->districts->exists($district)) {
            throw new DomainException('Quartier inconnu : choisissez un quartier de la liste.');
        }
        $idea = Idea::propose($this->ids->getId(), $participant->citizenId, $cmd->title, $cmd->description, $district, $this->clock->now());
        $this->ideas->save($idea);

        return $idea->followUpView();
    }
}
