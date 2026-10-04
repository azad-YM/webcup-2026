<?php

declare(strict_types=1);

namespace Participation\Application\Command\SubmitContribution;

use Participation\Application\Ports\Provider\ParticipantProvider;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Domain\Entity\Contribution;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** The response is the acknowledgement: reference CTR-…, first submission date, last change date. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SubmitContributionHandler
{
    public function __construct(
        private ParticipantProvider $participants,
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SubmitContributionCommand $cmd): array
    {
        $participant = $this->participants->current() ?? throw new NotFoundException('Le compte connecté n’est pas un compte citoyen.');
        $consultation = $this->consultations->find($cmd->consultationId);
        if ($consultation === null || !$consultation->isPublished()) {
            throw new NotFoundException('Consultation introuvable.');
        }
        $now = $this->clock->now();
        $answer = $consultation->acceptAnswer($cmd->choice, $cmd->rating, $cmd->comment, $now);
        $contribution = $this->contributions->findFor($consultation->id, $participant->citizenId);
        if ($contribution === null) {
            $contribution = Contribution::submit($this->ids->getId(), $consultation->id, $participant->citizenId, $answer, $now);
        } else {
            $contribution->change($answer, $now);
        }
        $this->contributions->save($contribution);

        return $contribution->receipt() + ['consultationTitle' => $consultation->title(), 'closesAt' => $consultation->closesAt()->format(DATE_ATOM)];
    }
}
