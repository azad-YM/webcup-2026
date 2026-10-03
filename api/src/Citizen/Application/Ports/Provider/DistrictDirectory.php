<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Closed list of districts, owned by Administration (adapter in `Administration/Infrastructure/Adapter/Citizen`). */
interface DistrictDirectory
{
    public function exists(string $district): bool;
}
