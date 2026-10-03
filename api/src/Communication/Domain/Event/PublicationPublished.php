<?php

declare(strict_types=1);

namespace Communication\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class PublicationPublished implements DomainEvent
{
    public function __construct(
        public string $publicationId,
        public bool $important,
    ) {}
}
