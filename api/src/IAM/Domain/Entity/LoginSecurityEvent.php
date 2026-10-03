<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/** Journal entry written when repeated login failures trigger a temporary lock. */
final class LoginSecurityEvent
{
    public function __construct(
        public readonly string $id,
        public readonly \DateTimeImmutable $occurredAt,
        /** account | ip | pair */
        public readonly string $scope,
        public readonly ?string $email,
        public readonly string $ip,
        public readonly int $failures,
        public readonly int $lockedSeconds,
    ) {}
}
