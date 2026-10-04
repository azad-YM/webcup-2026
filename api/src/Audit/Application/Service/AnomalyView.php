<?php

declare(strict_types=1);

namespace Audit\Application\Service;

use Audit\Domain\Entity\Anomaly;

/** F85 : représentation JSON d'une anomalie pour l'admin. */
final class AnomalyView
{
    public const STATUS_LABELS = ['new' => 'nouvelle', 'seen' => 'vue', 'handled' => 'traitée'];

    /** @return array<string, mixed> */
    public static function of(Anomaly $anomaly): array
    {
        return [
            'id' => $anomaly->id,
            'rule' => $anomaly->rule,
            'ruleLabel' => UnusualActivityDetector::RULES[$anomaly->rule] ?? $anomaly->title(),
            'category' => $anomaly->category,
            'severity' => $anomaly->severity(),
            'title' => $anomaly->title(),
            'explanation' => $anomaly->explanation(),
            'related' => $anomaly->related(),
            'status' => $anomaly->status(),
            'occurrences' => $anomaly->occurrences(),
            'reaction' => $anomaly->reaction(),
            'handledBy' => $anomaly->handledBy(),
            'handledAt' => $anomaly->handledAt()?->format(DATE_ATOM),
            'detectedAt' => $anomaly->detectedAt->format(DATE_ATOM),
            'lastSeenAt' => $anomaly->lastSeenAt()->format(DATE_ATOM),
        ];
    }
}
