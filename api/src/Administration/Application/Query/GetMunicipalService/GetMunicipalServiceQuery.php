<?php

declare(strict_types=1);

namespace Administration\Application\Query\GetMunicipalService;

final readonly class GetMunicipalServiceQuery
{
    public function __construct(public string $id) {}
}
