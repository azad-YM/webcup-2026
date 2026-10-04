<?php

declare(strict_types=1);

namespace Communication\Application\Query\GetPublication;

final readonly class GetPublicationQuery
{
    public function __construct(public string $id) {}
}
