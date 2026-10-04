<?php

declare(strict_types=1);

namespace Shared\Infrastructure\RateLimit;

/**
 * F69 : compteur d'une fenêtre fixe du limiteur de débit (table `rate_limit_counter`).
 * Cartographié pour que le schéma reste décrit par Doctrine ; lu et écrit en DBAL par `DatabaseRateLimiter`.
 * La clé est un condensé : ni adresse IP ni identifiant n'y figurent en clair.
 */
final class RateLimitCounter
{
    public function __construct(
        public readonly string $id,
        public readonly string $rule,
        public readonly int $hits,
        public readonly \DateTimeImmutable $expiresAt,
    ) {}
}
