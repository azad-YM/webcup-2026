<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListServiceRatings;

/** F76 : moyenne et nombre d'avis par service (agrégat public, sans identité). */
final readonly class ListServiceRatingsQuery
{
    public function __construct(public ?string $serviceId = null) {}
}
