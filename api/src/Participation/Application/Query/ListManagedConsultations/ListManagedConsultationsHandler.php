<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListManagedConsultations;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Domain\Entity\Consultation;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Every consultation with its live results (agents see them before the closure). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListManagedConsultationsHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ParticipationAccessPolicy $access,
        private IClock $clock,
    ) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListManagedConsultationsQuery $query): array
    {
        if (!$this->access->canRead()) {
            throw new AccessDeniedException('Permission admin.participation.read requise.');
        }
        $now = $this->clock->now();
        $items = $this->consultations->all();
        $tally = $this->contributions->tally(array_map(static fn (Consultation $item): string => $item->id, $items));
        $views = array_map(static fn (Consultation $item): array => $item->managementView($now, $tally[$item->id]), $items);
        usort($views, static fn (array $a, array $b): int => $b['updatedAt'] <=> $a['updatedAt']);

        return $views;
    }
}
