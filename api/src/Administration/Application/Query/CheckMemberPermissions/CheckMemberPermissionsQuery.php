<?php

declare(strict_types=1);

namespace Administration\Application\Query\CheckMemberPermissions;

final readonly class CheckMemberPermissionsQuery
{
    /** @param list<string> $permissions Exact permission keys required together. */
    public function __construct(
        public string $userId,
        public array $permissions,
    ) {}
}
