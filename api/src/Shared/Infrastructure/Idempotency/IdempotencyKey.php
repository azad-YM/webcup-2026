<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Idempotency;

/**
 * F82 : envoi déjà reçu (table `idempotency_keys`). Cartographié pour que le schéma reste décrit par Doctrine ;
 * lu et écrit en DBAL par `IdempotencyListener`. L'identifiant est un condensé (clé + route + session) :
 * ni jeton ni adresse en clair. La réponse conservée est celle que l'API a rendue au premier envoi.
 */
final class IdempotencyKey
{
    public function __construct(
        public readonly string $id,
        public readonly string $requestHash,
        public readonly string $state,
        public readonly ?int $statusCode,
        public readonly ?string $body,
        public readonly \DateTimeImmutable $createdAt,
        public readonly \DateTimeImmutable $expiresAt,
    ) {}
}
