<?php

declare(strict_types=1);

namespace Communication\Application;

/**
 * Realtime topics of Communication (ADR 004). Public topics are open to everyone; the private ones are
 * granted by Citizen (`CitizenAlertRealtimeAudience`) from the citizen's district and health consent.
 */
final class RealtimeTopics
{
    public const PUBLIC_ALERTS = 'public.alerts';
    public const PUBLIC_PUBLICATIONS = 'public.publications';
    public const HEALTH_ALERTS = 'alerts.health';
    public const DISTRICT_PREFIX = 'district.';

    public static function forAlert(string $audience, ?string $district): string
    {
        return match ($audience) {
            'district' => self::DISTRICT_PREFIX . mb_strtolower((string) $district),
            'health' => self::HEALTH_ALERTS,
            default => self::PUBLIC_ALERTS,
        };
    }
}
