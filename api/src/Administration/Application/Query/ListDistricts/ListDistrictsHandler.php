<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListDistricts;

use Administration\Domain\VO\District;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListDistrictsHandler
{
    /** @return list<string> */
    public function __invoke(ListDistrictsQuery $query): array
    {
        return District::ALL;
    }
}
