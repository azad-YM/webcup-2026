<?php

declare(strict_types=1);

namespace Tests\Shared\Doubles\Service;

use Shared\Application\Ports\Service\RealtimePublisher;

/** Keeps every publication so that a consumer's test can assert what would have been pushed. */
final class RecordingRealtimePublisher implements RealtimePublisher
{
    /** @var list<array{topic: string, event: string, payload: array<string, mixed>}> */
    public array $published = [];

    public function publish(string $topic, string $event, array $payload = []): void
    {
        $this->published[] = ['topic' => $topic, 'event' => $event, 'payload' => $payload];
    }
}
