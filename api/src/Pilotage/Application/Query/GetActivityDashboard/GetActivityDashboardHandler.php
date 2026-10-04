<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetActivityDashboard;

use Pilotage\Application\Ports\Provider\Activity\AccountSecurityActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\AdministrationActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\CitizenActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\CommunicationActivityProvider;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F50: key figures of the platform for the agents. Each figure comes from its owner through a Pilotage port. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetActivityDashboardHandler
{
    /** "Recent" = the last 24 hours. */
    public const RECENT_HOURS = 24;

    public function __construct(
        private PilotageAccessPolicy $access,
        private CitizenActivityProvider $citizens,
        private CommunicationActivityProvider $communication,
        private AccountSecurityActivityProvider $security,
        private AdministrationActivityProvider $administration,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(GetActivityDashboardQuery $query): array
    {
        if (!$this->access->canReadActivityDashboard()) {
            throw new AccessDeniedException('The activity dashboard requires the admin.pilotage.read permission.');
        }
        $now = $this->clock->now();
        $since = $now->modify(sprintf('-%d hours', self::RECENT_HOURS));
        $citizens = $this->citizens->citizenActivity($since);
        $communication = $this->communication->communicationActivity($now);
        $security = $this->security->accountSecurityActivity($since);
        $administration = $this->administration->administrationActivity();

        return [
            'generatedAt' => $now->format(\DateTimeInterface::ATOM),
            'recentHours' => self::RECENT_HOURS,
            'requests' => [
                'byStatus' => $citizens->requestsByStatus,
                'waiting' => $citizens->waitingRequests,
                'open' => $citizens->openRequests,
                'recent' => $citizens->newRequests,
                'oldestWaitingSince' => $citizens->oldestWaitingSince?->format(\DateTimeInterface::ATOM),
            ],
            'citizens' => [
                'active' => $citizens->activeCitizens,
                'suspended' => $citizens->suspendedCitizens,
                'recent' => $citizens->newCitizens,
            ],
            'communication' => [
                'activeAlerts' => $communication->activeAlerts,
                'criticalAlerts' => $communication->criticalAlerts,
                'scheduledAlerts' => $communication->scheduledAlerts,
                'publishedPublications' => $communication->publishedPublications,
                'draftPublications' => $communication->draftPublications,
            ],
            'security' => [
                'suspendedAccounts' => $security->suspendedAccounts,
                'blockedLogins' => $security->blockedLogins,
            ],
            'administration' => [
                'activeMembers' => $administration->activeMembers,
                'services' => $administration->services,
                'disruptedServices' => $administration->disruptedServices,
            ],
        ];
    }
}
