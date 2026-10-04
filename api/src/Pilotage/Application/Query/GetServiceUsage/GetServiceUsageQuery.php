<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetServiceUsage;

/** F98 : services les plus utilisés sur une période (`days`, ou `from`/`to` en AAAA-MM-JJ). */
final readonly class GetServiceUsageQuery
{
    public function __construct(public ?int $days = null, public ?string $from = null, public ?string $to = null) {}
}
