<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListPublications;

final readonly class ListPublicationsQuery
{
    public function __construct(public bool $importantOnly = false) {}
}
