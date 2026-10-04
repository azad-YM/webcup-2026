<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\SyncTracking;

final readonly class SyncTrackingCommand
{
    public function __construct(public string $siteUrl, public string $adminUrl, public bool $apply = false) {}
}
