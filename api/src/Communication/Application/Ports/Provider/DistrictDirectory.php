<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Provider;

/** Closed list of districts, owned by Administration (`Administration/Infrastructure/Adapter/Communication`). */
interface DistrictDirectory
{
    public function exists(string $district): bool;
}
