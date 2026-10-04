<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Provider;

/** Closed list of districts, owned by Administration (`Administration/Infrastructure/Adapter/Participation`). */
interface DistrictDirectory
{
    public function exists(string $district): bool;
}
