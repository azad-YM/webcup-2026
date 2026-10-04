<?php

declare(strict_types=1);

namespace Audit\Application\Command\ScanUnusualActivity;

/** F85 : lance une analyse. `manual` (bouton de l'admin, permission vérifiée) ou `schedule` (tâche planifiée). */
final readonly class ScanUnusualActivityCommand
{
    public function __construct(public string $trigger = 'manual') {}
}
