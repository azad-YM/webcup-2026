<?php

declare(strict_types=1);

namespace Example\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class ItemCreated implements DomainEvent
{
    public function __construct(public string $itemId, public string $name) {}
}
