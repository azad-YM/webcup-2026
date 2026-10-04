<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListAnomalies;

/** F85 : anomalies (filtres facultatifs) et compteurs de l'écran « Activité inhabituelle ». */
final readonly class ListAnomaliesQuery
{
    public function __construct(public ?string $status = null, public ?string $severity = null) {}
}
