<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/**
 * Technical throttling counter for one scope (account, IP or account+IP pair).
 * The id is a SHA-256 hash: neither addresses nor IPs are stored in clear here.
 */
final class LoginAttemptBucket
{
    public function __construct(
        public string $id,
        public int $failures,
        public int $windowUntil,
        public int $lockedUntil,
        public int $lockouts,
        public int $expiresAt,
    ) {}
}
