<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListPublicIdeas;

final readonly class ListPublicIdeasQuery
{
    public function __construct(public ?string $status = null) {}
}
