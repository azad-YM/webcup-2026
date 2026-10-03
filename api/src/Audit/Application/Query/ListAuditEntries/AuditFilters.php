<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListAuditEntries;

/** Normalized filters of the journal. Dates are inclusive days (Y-m-d, server time zone). */
final readonly class AuditFilters
{
    public function __construct(
        public ?string $actorId = null,
        public ?string $action = null,
        public ?string $category = null,
        public ?\DateTimeImmutable $from = null,
        public ?\DateTimeImmutable $to = null,
        public ?string $search = null,
    ) {}
}
