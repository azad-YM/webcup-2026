<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

interface LoginAttemptLimiter
{
    /** Consumes an attempt, returning seconds to wait (zero means allowed). */
    public function consume(string $email, string $ip): int;
}
