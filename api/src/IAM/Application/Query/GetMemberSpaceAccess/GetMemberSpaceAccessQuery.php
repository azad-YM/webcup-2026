<?php

declare(strict_types=1);

namespace IAM\Application\Query\GetMemberSpaceAccess;

final readonly class GetMemberSpaceAccessQuery
{
    public function __construct(public string $userId) {}
}
