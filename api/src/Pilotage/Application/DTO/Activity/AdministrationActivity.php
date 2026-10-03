<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Activity;

/** Contract of `AdministrationActivityProvider`: agents and municipal services, counted by Administration. */
final readonly class AdministrationActivity
{
    public function __construct(
        public int $activeMembers,
        public int $services,
        /** Services in maintenance or incident. */
        public int $disruptedServices,
    ) {}
}
