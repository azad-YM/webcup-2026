<?php

declare(strict_types=1);

namespace Participation\Application\Query\GetConsultation;

use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\ProjectRepository;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetConsultationHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ProjectRepository $projects,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(GetConsultationQuery $query): array
    {
        $consultation = $this->consultations->find($query->id);
        if ($consultation === null || !$consultation->isPublished()) {
            throw new NotFoundException('Consultation introuvable.');
        }
        $project = $consultation->projectId() === null ? null : $this->projects->find($consultation->projectId());

        return $consultation->publicView($this->clock->now(), $this->contributions->tally([$consultation->id])[$consultation->id])
            + ['projectTitle' => $project !== null && $project->isPublished() ? $project->title() : null];
    }
}
