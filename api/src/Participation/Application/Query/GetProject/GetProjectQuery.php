<?php

declare(strict_types=1);

namespace Participation\Application\Query\GetProject;

final readonly class GetProjectQuery
{
    public function __construct(public string $id) {}
}
