<?php

declare(strict_types=1);

namespace Communication\Application\Query;

use Communication\Domain\Entity\Alert;

/** Most severe first, then most recent start. */
final class AlertOrdering
{
    private const RANK = ['critical' => 0, 'warning' => 1, 'info' => 2];

    /**
     * @param array<Alert> $alerts
     * @return list<array<string, mixed>>
     */
    public static function views(array $alerts): array
    {
        $views = array_map(fn (Alert $alert) => $alert->publicView(), array_values($alerts));
        usort($views, fn (array $a, array $b) => [self::RANK[$a['severity']] ?? 3, $b['startsAt']] <=> [self::RANK[$b['severity']] ?? 3, $a['startsAt']]);

        return $views;
    }
}
