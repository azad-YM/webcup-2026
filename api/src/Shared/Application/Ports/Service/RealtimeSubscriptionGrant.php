<?php

declare(strict_types=1);
namespace Shared\Application\Ports\Service;
/** Caller MUST authorize the exact topic before invoking this technical signer. */
interface RealtimeSubscriptionGrant
{
    /** @return array{token?: string, auth?: string} */
    public function grant(string $topic, ?string $socketId = null): array;
}
