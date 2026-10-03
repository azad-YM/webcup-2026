<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Communication;

use Administration\Application\Query\ListDistricts\ListDistrictsHandler;
use Administration\Application\Query\ListDistricts\ListDistrictsQuery;
use Communication\Application\Ports\Provider\DistrictDirectory;

/** Communication validates the district of a targeted alert against the closed list of Administration. */
final readonly class AdminCommunicationDistrictDirectory implements DistrictDirectory
{
    public function __construct(private ListDistrictsHandler $districts) {}

    public function exists(string $district): bool
    {
        return in_array($district, ($this->districts)(new ListDistrictsQuery()), true);
    }
}
