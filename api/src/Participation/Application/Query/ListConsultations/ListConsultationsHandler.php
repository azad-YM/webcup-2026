<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListConsultations;

use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Consultation;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Open ones first (closing soonest), then upcoming, then closed (most recent first). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListConsultationsHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ProjectRepository $projects,
        private IClock $clock,
    ) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListConsultationsQuery $query): array
    {
        $now = $this->clock->now();
        $phase = $query->phase === null || $query->phase === '' ? null : $query->phase;
        $items = array_values(array_filter(
            $this->consultations->all(),
            static fn (Consultation $item): bool => $item->isPublished() && ($phase === null || $item->phase($now) === $phase),
        ));
        $tally = $this->contributions->tally(array_map(static fn (Consultation $item): string => $item->id, $items));
        $titles = [];
        foreach ($this->projects->all() as $project) {
            if ($project->isPublished()) {
                $titles[$project->id] = $project->title();
            }
        }
        $views = array_map(
            static fn (Consultation $item): array => $item->publicView($now, $tally[$item->id]) + ['projectTitle' => $titles[$item->projectId() ?? ''] ?? null],
            $items,
        );
        $rank = ['open' => 0, 'upcoming' => 1, 'closed' => 2];
        usort($views, static fn (array $a, array $b): int => [$rank[$a['phase']], $a['phase'] === 'closed' ? -strtotime($a['closesAt']) : strtotime($a['closesAt'])]
            <=> [$rank[$b['phase']], $b['phase'] === 'closed' ? -strtotime($b['closesAt']) : strtotime($b['closesAt'])]);

        return ['items' => $views];
    }
}
