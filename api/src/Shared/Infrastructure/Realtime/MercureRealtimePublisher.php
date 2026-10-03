<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Publishes to a Mercure hub (`POST {hub}` form-encoded, publisher JWT signed with HS256), without the bundle.
 * The logical topic is the Mercure topic, the event name is the SSE `type`, the payload is the JSON `data`.
 * Without hub URL or secret the adapter does nothing. The secret only signs: it is never sent nor logged.
 */
final readonly class MercureRealtimePublisher implements RealtimePublisher
{
    private const TIMEOUT = 3;
    private const MAX_DURATION = 5;

    public function __construct(
        private HttpClientInterface $httpClient,
        private string $hubUrl,
        #[\SensitiveParameter] private string $jwtSecret,
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
        if (trim($this->hubUrl) === '' || trim($this->jwtSecret) === '') {
            $this->logger->debug('Realtime publishing is disabled (no Mercure hub or secret).', ['topic' => $topic, 'event' => $event]);

            return;
        }
        $data = json_encode($payload === [] ? new \stdClass() : $payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            $status = $this->httpClient->request('POST', $this->hubUrl, [
                'headers' => ['Authorization' => 'Bearer ' . $this->publisherToken()],
                'body' => ['topic' => $topic, 'type' => $event, 'data' => $data] + (str_starts_with($topic, 'private.') ? ['private' => 'on'] : []),
                'timeout' => self::TIMEOUT,
                'max_duration' => self::MAX_DURATION,
            ])->getStatusCode();
            if ($status < 200 || $status >= 300) {
                $this->logger->warning('Mercure refused a realtime event.', ['topic' => $topic, 'event' => $event, 'status' => $status]);
            }
        } catch (TransportExceptionInterface $exception) {
            $this->logger->warning('Mercure is unreachable, realtime event dropped.', ['topic' => $topic, 'event' => $event, 'exception_class' => $exception::class]);
        }
    }

    /** Publisher JWT allowed on every topic (`mercure.publish: ["*"]`), as expected by the hub's publisher key. */
    private function publisherToken(): string
    {
        $encode = static fn (array $part): string => rtrim(strtr(base64_encode(json_encode($part, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');
        $unsigned = $encode(['alg' => 'HS256', 'typ' => 'JWT']) . '.' . $encode(['mercure' => ['publish' => ['*']]]);
        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $unsigned, $this->jwtSecret, true)), '+/', '-_'), '=');

        return $unsigned . '.' . $signature;
    }
}
