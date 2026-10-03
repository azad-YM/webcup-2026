<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/** Technical fixed-window counters; neither addresses nor IPs are stored in clear. */
final class LoginAttemptBucket
{
    public function __construct(public string $id, public int $attempts, public int $expiresAt) {}
}
