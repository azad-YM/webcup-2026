<?php

declare(strict_types=1);

namespace Communication\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class AlertPublished implements DomainEvent
{
    public function __construct(
        public string $alertId,
        public string $severity,
        public string $audience,
        public ?string $district,
    ) {}
}
