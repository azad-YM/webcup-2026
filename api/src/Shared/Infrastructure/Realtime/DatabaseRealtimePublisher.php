<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\RealtimePublisher;

/**
 * Transport `database`: stores the event in the shared `realtime_event` buffer, read by the SSE stream
 * (`GET /api/realtime/stream`). Runs on the existing PHP + MySQL stack, without any extra server.
 * Inside a transaction the event becomes visible only on commit. A failure is logged, never thrown.
 */
final readonly class DatabaseRealtimePublisher implements RealtimePublisher
{
    public function __construct(
        private RealtimeEventRepository $events,
        private IClock $clock,
        private LoggerInterface $logger = new NullLogger(),
    ) {}

    public function publish(string $topic, string $event, array $payload = []): void
    {
        if (!preg_match(self::TOPIC_PATTERN, $topic)) {
            throw new \InvalidArgumentException(sprintf('Invalid realtime topic "%s".', $topic));
        }
        if (!preg_match(self::TOPIC_PATTERN, $event)) {
            throw new \InvalidArgumentException(sprintf('Invalid realtime event name "%s".', $event));
        }
        $data = json_encode($payload === [] ? new \stdClass() : $payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            $this->events->append($topic, $event, $data, $this->clock->now());
        } catch (\Throwable $exception) {
            $this->logger->warning('Realtime event could not be stored, dropped.', ['topic' => $topic, 'event' => $event, 'exception_class' => $exception::class]);
        }
    }
}
