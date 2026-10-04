<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListProjects;

/** Published projects, optionally filtered by district (`city` = whole city) and status. */
final readonly class ListProjectsQuery
{
    public function __construct(public ?string $district = null, public ?string $status = null) {}
}
