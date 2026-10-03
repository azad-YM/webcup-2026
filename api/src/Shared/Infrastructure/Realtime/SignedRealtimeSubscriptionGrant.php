<?php

declare(strict_types=1);
namespace Shared\Infrastructure\Realtime;
use Shared\Application\Ports\Service\RealtimeSubscriptionGrant;
use Shared\Application\Ports\Service\IClock;
final readonly class SignedRealtimeSubscriptionGrant implements RealtimeSubscriptionGrant
{
    public function __construct(private IClock $clock, private string $transport, #[\SensitiveParameter] private string $mercureSecret, private string $pusherKey, #[\SensitiveParameter] private string $pusherSecret) {}
    public function grant(string $topic, ?string $socketId = null): array
    {
        if (!preg_match('/^private\.[a-zA-Z0-9_.-]+$/D', $topic)) throw new \InvalidArgumentException('A private topic is required.');
        if ($this->transport === 'mercure' && $this->mercureSecret !== '') {
            $encode = static fn(array $value): string => rtrim(strtr(base64_encode(json_encode($value, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
            $unsigned = $encode(['alg' => 'HS256', 'typ' => 'JWT']) . '.' . $encode(['exp' => $this->clock->now()->getTimestamp() + 300, 'mercure' => ['subscribe' => [$topic]]]);
            return ['token' => $unsigned . '.' . rtrim(strtr(base64_encode(hash_hmac('sha256', $unsigned, $this->mercureSecret, true)), '+/', '-_'), '=')];
        }
        if ($this->transport === 'pusher' && $this->pusherKey !== '' && $this->pusherSecret !== '') {
            if ($socketId === null || !preg_match('/^\d+\.\d+$/D', $socketId)) throw new \DomainException('Invalid socket identifier.');
            return ['auth' => $this->pusherKey . ':' . hash_hmac('sha256', $socketId . ':private-' . substr($topic, 8), $this->pusherSecret)];
        }
        return [];
    }
}
