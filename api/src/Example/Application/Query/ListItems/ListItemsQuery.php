<?php

declare(strict_types=1);

namespace Example\Application\Query\ListItems;

final readonly class ListItemsQuery
{
    public function __construct(public ?string $status = null) {}
}
