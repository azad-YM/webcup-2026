<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListActiveAlerts;

use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Application\Query\AlertOrdering;
use Communication\Domain\Entity\Alert;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Public banner (D18, F101): alerts addressed to every inhabitant or to one district (public information),
 * during their validity, plus those starting within `Alert::UPCOMING_HOURS` (`status: upcoming`) so that the
 * site can show them at the right time without waiting for a refresh. Health alerts stay private.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListActiveAlertsHandler
{
    public function __construct(private AlertRepository $alerts, private IClock $clock) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListActiveAlertsQuery $query): array
    {
        $now = $this->clock->now();

        $visible = array_filter(
            $this->alerts->all(),
            fn (Alert $alert) => $alert->audience() !== 'health' && ($alert->isActive($now) || $alert->isUpcoming($now)),
        );

        return array_map(
            fn (array $view) => $view + ['status' => new \DateTimeImmutable($view['startsAt']) > $now ? 'upcoming' : 'active'],
            AlertOrdering::views($visible),
        );
    }
}
