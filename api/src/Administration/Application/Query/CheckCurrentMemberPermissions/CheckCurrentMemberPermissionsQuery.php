<?php

declare(strict_types=1);

namespace Administration\Application\Query\CheckCurrentMemberPermissions;

final readonly class CheckCurrentMemberPermissionsQuery
{
    /** @param list<string> $permissions Exact permission keys required together. */
    public function __construct(public array $permissions) {}
}
