<?php

declare(strict_types=1);

namespace IAM\Application\Query\ListLoginSecurityEvents;

final readonly class ListLoginSecurityEventsQuery
{
    public function __construct(public ?string $search = null) {}
}
