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

    /**
     * F101 : une alerte de quartier est une information publique (panne du secteur nord…) : elle part sur le
     * topic public pour prévenir sans délai les visiteurs non connectés. Seules les alertes sanitaires restent privées.
     */
    public static function forAlert(string $audience, ?string $district): string
    {
        return $audience === 'health' ? self::HEALTH_ALERTS : self::PUBLIC_ALERTS;
    }
}
