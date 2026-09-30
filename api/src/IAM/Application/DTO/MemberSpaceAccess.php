<?php

declare(strict_types=1);

namespace IAM\Application\DTO;

final readonly class MemberSpaceAccess
{
    /** @param list<string> $roles */
    public function __construct(public array $roles) {}
}
