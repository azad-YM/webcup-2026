<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

/**
 * Progressive temporary locks after repeated login failures, per account, per IP and per account+IP pair.
 * Every method returns or works with seconds; zero means "allowed".
 */
interface LoginAttemptLimiter
{
    /** Seconds to wait before a new attempt is accepted for this e-mail and IP. */
    public function retryAfter(string $email, string $ip): int;

    /** Counts a failed attempt; returns the lock duration when this failure triggers a lock (zero otherwise). */
    public function recordFailure(string $email, string $ip): int;

    /** A successful login clears the account and pair counters (the IP counter is kept). */
    public function recordSuccess(string $email, string $ip): void;
}
