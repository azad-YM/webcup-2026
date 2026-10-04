<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListMyParticipation;

use Participation\Application\Ports\Provider\ParticipantProvider;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Domain\Entity\Idea;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyParticipationHandler
{
    public function __construct(
        private ParticipantProvider $participants,
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private IdeaRepository $ideas,
        private IClock $clock,
    ) {}

    /** @return array{contributions: list<array<string, mixed>>, ideas: list<array<string, mixed>>} */
    public function __invoke(ListMyParticipationQuery $query): array
    {
        $participant = $this->participants->current() ?? throw new NotFoundException('Le compte connecté n’est pas un compte citoyen.');
        $now = $this->clock->now();
        $contributions = [];
        foreach ($this->contributions->findByCitizen($participant->citizenId) as $contribution) {
            $consultation = $this->consultations->find($contribution->consultationId);
            $contributions[] = $contribution->receipt() + [
                'consultation' => $consultation === null ? null : [
                    'id' => $consultation->id,
                    'title' => $consultation->title(),
                    'kind' => $consultation->kind(),
                    'options' => $consultation->options(),
                    'closesAt' => $consultation->closesAt()->format(DATE_ATOM),
                    'phase' => $consultation->phase($now),
                    'visible' => $consultation->isPublished(),
                ],
            ];
        }

        return [
            'contributions' => $contributions,
            'ideas' => array_map(static fn (Idea $idea): array => $idea->followUpView(), $this->ideas->findByCitizen($participant->citizenId)),
        ];
    }
}
