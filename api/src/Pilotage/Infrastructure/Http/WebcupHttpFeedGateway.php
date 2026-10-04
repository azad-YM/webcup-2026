<?php

declare(strict_types=1);

namespace Pilotage\Infrastructure\Http;

use Pilotage\Application\Exception\WebcupApiKeyMissing;
use Pilotage\Application\Exception\WebcupApiKeyRejected;
use Pilotage\Application\Exception\WebcupFeedUnavailable;
use Pilotage\Application\Ports\Gateway\WebcupFeedGateway;
use Pilotage\Domain\Model\WebcupFeed;
use Pilotage\Domain\Model\WebcupRequest;
use Pilotage\Domain\Model\WebcupSession;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Shared\Application\Ports\Service\IClock;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\DecodingExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Reads the contest API (`GET WEBCUP_API_URL` with the `X-Webcup-Api-Key` header) and keeps a valid answer
 * for CACHE_TTL seconds so that agents' polling does not hit the API on every request. Errors are never cached.
 * The key is sent only in the header: it never appears in an URL, a message or a log entry.
 */
final readonly class WebcupHttpFeedGateway implements WebcupFeedGateway
{
    public const CACHE_TTL = 20;
    private const TIMEOUT = 5;
    private const MAX_DURATION = 8;

    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheInterface $cache,
        private IClock $clock,
        private string $apiUrl,
        #[\SensitiveParameter] private string $apiKey,
        private LoggerInterface $logger = new NullLogger(),
    ) {}

    public function fetch(): WebcupFeed
    {
        if (trim($this->apiKey) === '') {
            throw new WebcupApiKeyMissing();
        }
        /** @var array{payload: array{session: array<string, mixed>, requests: list<mixed>}, fetchedAt: string} $snapshot */
        $snapshot = $this->cache->get('webcup_feed_' . hash('xxh128', $this->apiUrl), function (ItemInterface $item): array {
            $item->expiresAfter(self::CACHE_TTL);

            return ['payload' => $this->download(), 'fetchedAt' => $this->clock->now()->format(\DateTimeInterface::ATOM)];
        });

        return $this->toFeed($snapshot['payload'], new \DateTimeImmutable($snapshot['fetchedAt']));
    }

    /** @return array{session: array<string, mixed>, requests: list<mixed>} */
    private function download(): array
    {
        try {
            $response = $this->httpClient->request('GET', $this->apiUrl, [
                'headers' => ['X-Webcup-Api-Key' => $this->apiKey, 'Accept' => 'application/json'],
                'timeout' => self::TIMEOUT,
                'max_duration' => self::MAX_DURATION,
            ]);
            $status = $response->getStatusCode();
            if ($status === 401 || $status === 403) {
                $this->logger->warning('Webcup API refused the configured key.', ['status' => $status]);
                throw new WebcupApiKeyRejected();
            }
            if ($status < 200 || $status >= 300) {
                $this->logger->warning('Webcup API answered with an error status.', ['status' => $status]);
                throw new WebcupFeedUnavailable(sprintf('L’API du concours a répondu avec le statut %d.', $status));
            }
            $payload = $response->toArray(false);
        } catch (TransportExceptionInterface $exception) {
            // Only the exception class is logged: transport messages may echo request details.
            $this->logger->warning('Webcup API is unreachable.', ['exception_class' => $exception::class]);
            throw new WebcupFeedUnavailable();
        } catch (DecodingExceptionInterface) {
            $this->logger->warning('Webcup API answer is not valid JSON.');
            throw new WebcupFeedUnavailable();
        }
        if (!is_array($payload['session'] ?? null) || !is_array($payload['requests'] ?? null)) {
            $this->logger->warning('Webcup API answer has an unexpected shape.');
            throw new WebcupFeedUnavailable('L’API du concours a renvoyé une réponse au format inattendu.');
        }

        return ['session' => $payload['session'], 'requests' => array_values($payload['requests'])];
    }

    /** @param array{session: array<string, mixed>, requests: list<mixed>} $payload */
    private function toFeed(array $payload, \DateTimeImmutable $fetchedAt): WebcupFeed
    {
        $session = $payload['session'];
        $requests = [];
        foreach ($payload['requests'] as $request) {
            $code = is_array($request) ? self::string($request['request_code'] ?? null) : null;
            if ($code === null) {
                continue;
            }
            $xpBase = self::int($request['xp_base'] ?? null) ?? 0;
            $xpTimeBonus = self::int($request['xp_time_bonus'] ?? null) ?? 0;
            $xpTotal = self::int($request['xp_total'] ?? null) ?? $xpBase + $xpTimeBonus;
            $xpAvailable = $request['xp_available'] ?? null;
            $requests[] = new WebcupRequest(
                requestCode: $code,
                requesterName: self::string($request['requester_name'] ?? null),
                requesterType: self::string($request['requester_type'] ?? null),
                messagePublic: self::string($request['message_public'] ?? null),
                difficulty: self::string($request['difficulty'] ?? null),
                difficultyLevel: self::int($request['difficulty_level'] ?? null),
                xpBase: $xpBase,
                xpTimeBonus: $xpTimeBonus,
                xpTotal: $xpTotal,
                // The documentation does not type this field: a boolean means "the whole xp_total is still available".
                xpAvailable: is_bool($xpAvailable) ? ($xpAvailable ? $xpTotal : 0) : self::int($xpAvailable),
                isInitial: self::bool($request['is_initial'] ?? null),
                waveNumber: self::int($request['wave_number'] ?? null),
                arrivalTime: self::string($request['arrival_time'] ?? null),
                groupName: self::string($request['group_name'] ?? null),
                isAiRequest: self::bool($request['is_ai_request'] ?? null),
                sortOrder: self::int($request['sort_order'] ?? null),
            );
        }

        return new WebcupFeed(new WebcupSession(
            status: self::string($session['status'] ?? null),
            isRunning: self::bool($session['is_running'] ?? null),
            currentWave: self::int($session['current_wave'] ?? null),
            elapsedMinutes: self::int($session['elapsed_minutes'] ?? null),
            visibleRequestsCount: self::int($session['visible_requests_count'] ?? null),
            nextWaveNumber: self::int($session['next_wave_number'] ?? null),
            minutesUntilNextWave: self::int($session['minutes_until_next_wave'] ?? null),
        ), $requests, $fetchedAt);
    }

    private static function string(mixed $value): ?string
    {
        if (!is_scalar($value) || is_bool($value)) {
            return null;
        }
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private static function int(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }
        if (is_float($value) || (is_string($value) && is_numeric(trim($value)))) {
            return (int) round((float) $value);
        }

        return null;
    }

    private static function bool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return $value != 0;
        }

        return is_string($value) && in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'oui'], true);
    }
}
