<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime\Http;

use Shared\Application\Ports\Provider\RealtimeAccountProvider;
use Shared\Infrastructure\RateLimit\DatabaseRateLimiter;
use Shared\Infrastructure\Realtime\RealtimeAudience;
use Shared\Infrastructure\Realtime\RealtimeEventRepository;
use Shared\Infrastructure\Realtime\RealtimeTicketSigner;
use Symfony\Component\HttpFoundation\EventStreamResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ServerEvent;
use Symfony\Component\Routing\Attribute\Route;

/**
 * SSE endpoint of the `database` realtime transport (ADR 004). No business rule here:
 * identify the account (ticket), resolve its topics server side, stream the buffered events.
 *
 * Connections are short (REALTIME_STREAM_SECONDS, 20 s by default) because each open stream holds a PHP
 * worker on shared hosting; `EventSource` reconnects by itself and resumes from `Last-Event-ID`.
 *
 * F78 (ADR 012): the number of streams opened per connection window is capped (`REALTIME_MAX_STREAMS`, counted
 * with the database rate limiter): beyond it the stream answers `503` with a random `Retry-After`, and screens
 * keep their periodic refresh. The reconnection delay sent to browsers (`retry:`) is randomized (jitter) so
 * that thousands of tabs do not reconnect in the same second.
 */
final readonly class RealtimeController
{
    private const RETRY_MS = 1000;
    private const RETRY_JITTER_MS = 4000;
    private const POLL_MICROSECONDS = 1_000_000;
    private const KEEP_ALIVE_SECONDS = 5;

    public function __construct(
        private RealtimeEventRepository $events,
        private RealtimeAudience $audience,
        private RealtimeTicketSigner $tickets,
        private RealtimeAccountProvider $accounts,
        private int $streamSeconds,
        private ?DatabaseRateLimiter $limiter = null,
        private int $maxStreams = 0,
    ) {}

    /** Exchanges the JWT (Authorization header) for a short-lived ticket usable in the stream URL. */
    #[Route('/api/realtime/tickets', name: 'realtime_issue_ticket', methods: ['POST'], format: 'json')]
    public function ticket(): JsonResponse
    {
        $userId = $this->accounts->currentUserId();
        if ($userId === null) {
            return new JsonResponse(['message' => 'Authentication required.'], 401);
        }

        return new JsonResponse(['ticket' => $this->tickets->issue($userId), 'expiresIn' => RealtimeTicketSigner::TTL_SECONDS]);
    }

    /** Public topics for everyone; private topics of the account when a valid ticket is given. */
    #[Route('/api/realtime/stream', name: 'realtime_stream', methods: ['GET'])]
    public function stream(Request $request): JsonResponse|EventStreamResponse
    {
        $userId = null;
        $ticket = $request->query->getString('ticket');
        if ($ticket !== '') {
            $userId = $this->tickets->verify($ticket);
            if ($userId === null) {
                // The client fetches a new ticket and reopens the stream.
                return new JsonResponse(['message' => 'Invalid or expired realtime ticket.'], 401);
            }
        }
        if ($this->limiter !== null && $this->maxStreams > 0
            && $this->limiter->consume('realtime_stream', 'all', $this->maxStreams, max(5, $this->streamSeconds)) !== null) {
            $retryAfter = random_int(15, 60);

            return new JsonResponse(
                ['code' => 'realtime_busy', 'error' => 'Trop de connexions en direct en ce moment : la page se met à jour régulièrement à la place.', 'retryAfter' => $retryAfter],
                503,
                ['Retry-After' => (string) $retryAfter],
            );
        }
        $topics = $this->audience->topicsFor($userId);
        $resume = $request->headers->get('Last-Event-ID') ?? $request->query->get('lastEventId');
        $cursor = is_numeric($resume) ? max(0, (int) $resume) : $this->events->lastId();
        $seconds = $this->streamSeconds;
        $events = $this->events;

        return new EventStreamResponse(
            static function () use ($events, $topics, $cursor, $seconds): iterable {
                if ($seconds > 0) {
                    @set_time_limit($seconds + 10);
                }
                $deadline = microtime(true) + $seconds;
                $lastKeepAlive = microtime(true);
                // Flushes the headers at once so that the browser considers the stream open.
                yield new ServerEvent('', comment: 'connected');
                do {
                    foreach ($events->findAfter($cursor, $topics) as $event) {
                        $cursor = $event['id'];
                        yield new ServerEvent($event['payload'], type: $event['type'], id: (string) $event['id']);
                    }
                    if (microtime(true) >= $deadline) {
                        break;
                    }
                    if (microtime(true) - $lastKeepAlive >= self::KEEP_ALIVE_SECONDS) {
                        $lastKeepAlive = microtime(true);
                        yield new ServerEvent('', comment: 'keep-alive');
                    }
                    usleep(self::POLL_MICROSECONDS);
                } while (microtime(true) < $deadline);
            },
            headers: ['Cache-Control' => 'no-cache, no-transform', 'X-Accel-Buffering' => 'no'],
            retry: self::RETRY_MS + random_int(0, self::RETRY_JITTER_MS),
        );
    }
}
