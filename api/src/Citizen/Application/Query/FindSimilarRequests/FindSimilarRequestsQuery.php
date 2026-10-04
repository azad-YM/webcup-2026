<?php

declare(strict_types=1);

namespace Citizen\Application\Query\FindSimilarRequests;

final readonly class FindSimilarRequestsQuery
{
    public function __construct(public string $requestId) {}
}
