<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyServiceRequest;

final readonly class GetMyServiceRequestQuery
{
    public function __construct(public string $reference) {}
}
