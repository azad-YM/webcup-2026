<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetActivityReport;

/** F103 : rapport synthétique de l'activité sur une période (`days`, ou `from`/`to` en AAAA-MM-JJ). */
final readonly class GetActivityReportQuery
{
    public function __construct(public ?int $days = null, public ?string $from = null, public ?string $to = null) {}
}
