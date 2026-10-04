<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListSecurityEvents;

/** F100 : derniers événements de sécurité (`limit` : 1 à 50, 20 par défaut ; `days` : 1 à 30, 7 par défaut). */
final readonly class ListSecurityEventsQuery
{
    public function __construct(public int $limit = 20, public int $days = 7) {}
}
