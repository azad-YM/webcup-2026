<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Shared\Application\Ports\Service\RealtimePublisher;

/** Transport `none`: real time switched off; clients rely on their usual polling. */
final readonly class NullRealtimePublisher implements RealtimePublisher
{
    public function publish(string $topic, string $event, array $payload = []): void
    {
        if (!preg_match(self::TOPIC_PATTERN, $topic) || !preg_match(self::TOPIC_PATTERN, $event)) {
            throw new \InvalidArgumentException(sprintf('Invalid realtime topic "%s" or event "%s".', $topic, $event));
        }
    }
}
