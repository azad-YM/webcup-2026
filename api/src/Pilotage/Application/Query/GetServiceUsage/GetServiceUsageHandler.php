<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetServiceUsage;

use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Service\ReportPeriod;
use Pilotage\Application\Service\ServiceUsageAnalysis;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F98 : même public que le tableau de bord de l'activité (`admin.pilotage.read`) ; comptes seulement, aucune donnée personnelle. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetServiceUsageHandler
{
    public function __construct(private PilotageAccessPolicy $access, private ServiceUsageAnalysis $analysis, private IClock $clock) {}

    /** @return array<string, mixed> */
    public function __invoke(GetServiceUsageQuery $query): array
    {
        if (!$this->access->canReadActivityDashboard()) {
            throw new AccessDeniedException('Service usage requires the admin.pilotage.read permission.');
        }
        $now = $this->clock->now();
        [$from, $to] = ReportPeriod::resolve($query->days, $query->from, $query->to, $now);

        return ['generatedAt' => $now->format(DATE_ATOM)] + $this->analysis->analyse($from, $to);
    }
}
