<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/** F54/F55 : trace d'une connexion réussie (méthode, appareil, adresse IP), conservée 90 jours. */
class SignInRecord
{
    public const METHOD_PASSWORD = 'password';
    public const METHOD_LINK = 'link';
    public const RETENTION_DAYS = 90;

    public function __construct(
        public readonly string $id,
        public readonly string $userId,
        public readonly ?string $deviceId,
        public readonly string $deviceLabel,
        public readonly string $method,
        public readonly bool $secondFactor,
        public readonly string $ip,
        public readonly \DateTimeImmutable $occurredAt,
    ) {}
}
