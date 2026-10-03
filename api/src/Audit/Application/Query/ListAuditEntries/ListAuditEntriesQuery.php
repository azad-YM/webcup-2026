<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListAuditEntries;

final readonly class ListAuditEntriesQuery
{
    public function __construct(
        public ?string $actor = null,
        public ?string $action = null,
        public ?string $category = null,
        public ?string $from = null,
        public ?string $to = null,
        public ?string $search = null,
    ) {}
}
