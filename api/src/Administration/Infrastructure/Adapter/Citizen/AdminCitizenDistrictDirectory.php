<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Citizen;

use Administration\Application\Query\ListDistricts\ListDistrictsHandler;
use Administration\Application\Query\ListDistricts\ListDistrictsQuery;
use Citizen\Application\Ports\Provider\DistrictDirectory;

/** Citizen validates the district of a profile against the closed list of Administration. */
final readonly class AdminCitizenDistrictDirectory implements DistrictDirectory
{
    public function __construct(private ListDistrictsHandler $districts) {}

    public function exists(string $district): bool
    {
        return in_array($district, ($this->districts)(new ListDistrictsQuery()), true);
    }
}
