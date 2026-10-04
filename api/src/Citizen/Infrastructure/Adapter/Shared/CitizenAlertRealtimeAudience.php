<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Shared;

use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Application\Ports\Provider\RealtimeAudienceProvider;

/**
 * Private realtime topics of the targeted alerts of Communication, granted from the citizen's own data:
 * `district.{district}` (lower case) for the district of the profile, `alerts.health` with the health consent.
 * The topic names are the contract documented by Communication.
 */
final readonly class CitizenAlertRealtimeAudience implements RealtimeAudienceProvider
{
    public function __construct(
        private CitizenRepository $citizens,
        private AlertPreferenceRepository $preferences,
    ) {}

    public function topicsFor(string $userId): array
    {
        $citizen = $this->citizens->findByUserId($userId);
        if ($citizen === null) {
            return [];
        }
        $topics = [];
        if ($citizen->district() !== null) {
            $topics[] = 'district.' . mb_strtolower($citizen->district());
        }
        if ($this->preferences->get($citizen->id)->healthConsent()) {
            $topics[] = 'alerts.health';
        }

        return $topics;
    }
}
