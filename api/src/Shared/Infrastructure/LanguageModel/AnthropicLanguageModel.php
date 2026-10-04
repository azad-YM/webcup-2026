<?php

declare(strict_types=1);

namespace Shared\Infrastructure\LanguageModel;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Shared\Application\Ports\Service\LanguageModel;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Claude Messages API (`POST /v1/messages`). The key stays server side (`ANTHROPIC_API_KEY` in `.env.local`) and is
 * sent only in the `x-api-key` header. Identical prompts are answered from the cache for CACHE_TTL seconds, which keeps
 * cost and load low under heavy traffic. Failures are logged without prompt content and turn into null (local fallback).
 */
final readonly class AnthropicLanguageModel implements LanguageModel
{
    public const CACHE_TTL = 3600;
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';
    private const TIMEOUT = 6;
    private const MAX_DURATION = 12;

    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheInterface $cache,
        #[\SensitiveParameter] private string $apiKey,
        private string $model,
        private LoggerInterface $logger = new NullLogger(),
    ) {}

    public function isAvailable(): bool
    {
        return trim($this->apiKey) !== '';
    }

    public function complete(string $system, string $user, int $maxTokens = 512): ?string
    {
        if (!$this->isAvailable() || trim($user) === '') {
            return null;
        }
        $key = 'llm_' . hash('xxh128', $this->model . "\0" . $maxTokens . "\0" . $system . "\0" . $user);
        $answer = $this->cache->get($key, function (ItemInterface $item) use ($system, $user, $maxTokens): string {
            $answer = $this->call($system, $user, $maxTokens);
            // Failures are cached only briefly so that a provider outage does not slow every request down.
            $item->expiresAfter($answer === '' ? 30 : self::CACHE_TTL);

            return $answer;
        });

        return $answer === '' ? null : $answer;
    }

    private function call(string $system, string $user, int $maxTokens): string
    {
        try {
            $response = $this->httpClient->request('POST', self::ENDPOINT, [
                'headers' => [
                    'x-api-key' => $this->apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'max_tokens' => max(1, min($maxTokens, 2048)),
                    'system' => $system,
                    'messages' => [['role' => 'user', 'content' => $user]],
                ],
                'timeout' => self::TIMEOUT,
                'max_duration' => self::MAX_DURATION,
            ]);
            $status = $response->getStatusCode();
            if ($status < 200 || $status >= 300) {
                $this->logger->warning('Language model answered with an error status.', ['status' => $status]);

                return '';
            }
            $payload = $response->toArray(false);
        } catch (\Throwable $exception) {
            $this->logger->warning('Language model is unreachable.', ['exception_class' => $exception::class]);

            return '';
        }
        $text = '';
        foreach ((array) ($payload['content'] ?? []) as $block) {
            if (\is_array($block) && ($block['type'] ?? null) === 'text' && \is_string($block['text'] ?? null)) {
                $text .= $block['text'];
            }
        }

        return trim($text);
    }
}
