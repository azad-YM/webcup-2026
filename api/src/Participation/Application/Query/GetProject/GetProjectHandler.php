<?php

declare(strict_types=1);

namespace Participation\Application\Query\GetProject;

use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Consultation;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** A published project with its published consultations. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetProjectHandler
{
    public function __construct(
        private ProjectRepository $projects,
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(GetProjectQuery $query): array
    {
        $project = $this->projects->find($query->id);
        if ($project === null || !$project->isPublished()) {
            throw new NotFoundException('Projet introuvable.');
        }
        $now = $this->clock->now();
        $linked = array_values(array_filter(
            $this->consultations->all(),
            static fn (Consultation $item): bool => $item->isPublished() && $item->projectId() === $project->id,
        ));
        $tally = $this->contributions->tally(array_map(static fn (Consultation $item): string => $item->id, $linked));

        return $project->publicView() + [
            'consultations' => array_map(static fn (Consultation $item): array => $item->publicView($now, $tally[$item->id]), $linked),
        ];
    }
}
