<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Participation;

use Administration\Application\Query\ListDistricts\ListDistrictsHandler;
use Administration\Application\Query\ListDistricts\ListDistrictsQuery;
use Participation\Application\Ports\Provider\DistrictDirectory;

/** Participation validates the district of a project or an idea against the closed list of Administration. */
final readonly class AdminParticipationDistrictDirectory implements DistrictDirectory
{
    public function __construct(private ListDistrictsHandler $districts) {}

    public function exists(string $district): bool
    {
        return in_array($district, ($this->districts)(new ListDistrictsQuery()), true);
    }
}
