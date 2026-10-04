<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListConcernQueue;

final readonly class ListConcernQueueQuery
{
    public function __construct(public ?string $status = null) {}
}
