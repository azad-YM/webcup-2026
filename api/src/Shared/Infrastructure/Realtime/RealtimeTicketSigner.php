<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Shared\Application\Ports\Service\IClock;

/**
 * Short-lived subscription ticket for the SSE stream. `EventSource` cannot send the `Authorization` header and
 * a JWT never goes in a URL: the client exchanges its JWT for this opaque ticket, valid only to open the stream.
 * It carries the account identifier; the topics are resolved by the server on every connection.
 */
final readonly class RealtimeTicketSigner
{
    public const TTL_SECONDS = 900;

    public function __construct(#[\SensitiveParameter] private string $secret, private IClock $clock) {}

    public function issue(string $userId): string
    {
        $body = self::encode(json_encode(['sub' => $userId, 'exp' => $this->clock->now()->getTimestamp() + self::TTL_SECONDS], JSON_THROW_ON_ERROR));

        return $body . '.' . $this->sign($body);
    }

    /** Account identifier of a valid ticket, or null when the ticket is malformed, forged or expired. */
    public function verify(string $ticket): ?string
    {
        $parts = explode('.', $ticket);
        if (count($parts) !== 2 || !hash_equals($this->sign($parts[0]), $parts[1])) {
            return null;
        }
        $claims = json_decode((string) base64_decode(strtr($parts[0], '-_', '+/'), true), true);
        if (!is_array($claims) || !is_string($claims['sub'] ?? null) || !is_int($claims['exp'] ?? null)) {
            return null;
        }

        return $claims['exp'] > $this->clock->now()->getTimestamp() ? $claims['sub'] : null;
    }

    private function sign(string $body): string
    {
        return self::encode(hash_hmac('sha256', 'realtime-ticket.' . $body, $this->secret, true));
    }

    private static function encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
