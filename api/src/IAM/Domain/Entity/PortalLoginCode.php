<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;
final class PortalLoginCode
{
    public function __construct(public readonly string $hash, public readonly string $userId, public readonly string $email, public readonly string $destination, public readonly string $challenge, public readonly string $sessionHash, public readonly int $expiresAt, public readonly int $sessionExpiresAt) {}
}
