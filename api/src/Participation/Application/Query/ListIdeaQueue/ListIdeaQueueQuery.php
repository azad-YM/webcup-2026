<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListIdeaQueue;

final readonly class ListIdeaQueueQuery
{
    public function __construct(public ?string $status = null) {}
}
