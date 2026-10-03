<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Publishes through the Pusher Channels HTTP API (`POST /apps/{id}/events`, signed with HMAC-SHA256).
 * A plain HTTPS call: no long-running process on our side, which keeps it usable on shared hosting.
 * The logical topic is used as the channel name. Without credentials the adapter does nothing.
 * The secret is only used to sign: it never appears in a request, a message or a log entry.
 */
final readonly class PusherRealtimePublisher implements RealtimePublisher
{
    /** Pusher refuses event data above 10 kB. */
    public const MAX_DATA_BYTES = 10240;
    private const TIMEOUT = 3;
    private const MAX_DURATION = 5;

    public function __construct(
        private HttpClientInterface $httpClient,
        private IClock $clock,
        private string $appId,
        private string $key,
        #[\SensitiveParameter] private string $secret,
        private string $cluster,
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
        if (!$this->isConfigured()) {
            $this->logger->debug('Realtime publishing is disabled (no Pusher credentials).', ['topic' => $topic, 'event' => $event]);

            return;
        }
        $data = json_encode($payload === [] ? new \stdClass() : $payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (strlen($data) > self::MAX_DATA_BYTES) {
            $this->logger->warning('Realtime payload too large, not published.', ['topic' => $topic, 'event' => $event, 'bytes' => strlen($data)]);

            return;
        }
        $body = json_encode(['name' => $event, 'channels' => [str_starts_with($topic, 'private.') ? 'private-' . substr($topic, 8) : $topic], 'data' => $data], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $path = sprintf('/apps/%s/events', $this->appId);

        try {
            $status = $this->httpClient->request('POST', sprintf('https://api-%s.pusher.com%s', $this->cluster, $path), [
                'query' => $this->signedQuery($path, $body),
                'headers' => ['Content-Type' => 'application/json'],
                'body' => $body,
                'timeout' => self::TIMEOUT,
                'max_duration' => self::MAX_DURATION,
            ])->getStatusCode();
            if ($status < 200 || $status >= 300) {
                $this->logger->warning('Pusher refused a realtime event.', ['topic' => $topic, 'event' => $event, 'status' => $status]);
            }
        } catch (TransportExceptionInterface $exception) {
            // Only the exception class is logged: transport messages may echo the signed URL.
            $this->logger->warning('Pusher is unreachable, realtime event dropped.', ['topic' => $topic, 'event' => $event, 'exception_class' => $exception::class]);
        }
    }

    /**
     * Pusher's REST authentication: sign "METHOD\nPATH\nsorted query" with the secret.
     *
     * @return array<string, string>
     */
    private function signedQuery(string $path, string $body): array
    {
        $query = [
            'auth_key' => $this->key,
            'auth_timestamp' => (string) $this->clock->now()->getTimestamp(),
            'auth_version' => '1.0',
            'body_md5' => md5($body),
        ];
        ksort($query);
        $toSign = implode("\n", ['POST', $path, urldecode(http_build_query($query))]);
        $query['auth_signature'] = hash_hmac('sha256', $toSign, $this->secret);

        return $query;
    }

    private function isConfigured(): bool
    {
        return trim($this->appId) !== '' && trim($this->key) !== '' && trim($this->secret) !== '' && trim($this->cluster) !== '';
    }
}
