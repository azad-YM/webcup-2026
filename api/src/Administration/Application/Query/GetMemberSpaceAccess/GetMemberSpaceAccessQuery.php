<?php

declare(strict_types=1);

namespace Administration\Application\Query\GetMemberSpaceAccess;

final readonly class GetMemberSpaceAccessQuery
{
    public function __construct(public string $userId) {}
}
