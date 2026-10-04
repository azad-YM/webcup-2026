<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListConsultationContributions;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Domain\Entity\Contribution;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Answers of a consultation for the agents, without the identity of the citizens. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListConsultationContributionsHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ParticipationAccessPolicy $access,
    ) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListConsultationContributionsQuery $query): array
    {
        if (!$this->access->canRead()) {
            throw new AccessDeniedException('Permission admin.participation.read requise.');
        }
        $this->consultations->find($query->consultationId) ?? throw new NotFoundException('Consultation introuvable.');

        return ['items' => array_map(
            static fn (Contribution $item): array => $item->anonymousView(),
            $this->contributions->findByConsultation($query->consultationId),
        )];
    }
}
