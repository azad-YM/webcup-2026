<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListActiveAlerts;

use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Application\Query\AlertOrdering;
use Communication\Domain\Entity\Alert;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Public banner (D18): alerts addressed to every inhabitant, during their validity. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListActiveAlertsHandler
{
    public function __construct(private AlertRepository $alerts, private IClock $clock) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListActiveAlertsQuery $query): array
    {
        $now = $this->clock->now();

        return AlertOrdering::views(array_filter(
            $this->alerts->all(),
            fn (Alert $alert) => $alert->audience() === 'all' && $alert->isActive($now),
        ));
    }
}
