<?php

declare(strict_types=1);

namespace Shared\Infrastructure\AbuseSignal;

/**
 * F81, F85 : un signal d'abus (table `abuse_signals`). Cartographié pour que le schéma reste décrit par Doctrine ;
 * lu et écrit en DBAL par `DatabaseAbuseSignals`. `client` est un condensé (jamais l'adresse IP en clair).
 */
final class AbuseSignal
{
    public function __construct(
        public readonly int $id,
        public readonly string $kind,
        public readonly string $rule,
        public readonly string $client,
        public readonly \DateTimeImmutable $occurredAt,
    ) {}
}
