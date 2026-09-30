<?php

declare(strict_types=1);

namespace Example\Application\Query\GetItem;

final readonly class GetItemQuery
{
    public function __construct(public string $id) {}
}
