<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestQueue;

final readonly class ListRequestQueueQuery
{
    public function __construct(
        public ?string $status = null,
        public int $page = 1,
    ) {}
}
