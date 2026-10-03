<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

/**
 * Row of the technical `realtime_event` buffer. Mapped only so that the schema tools create the table;
 * reads and writes go through RealtimeEventRepository (DBAL). Belongs to no business context.
 */
class RealtimeEvent
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $topic,
        public readonly string $type,
        public readonly string $payload,
        public readonly \DateTimeImmutable $createdAt,
    ) {}
}
