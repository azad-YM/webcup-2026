<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Service;

/**
 * F81, F85 (ADR 012) : signaux techniques d'abus relevés par les protections transverses de Shared
 * (limitation de débit `429`, envois refusés ou mis au défi par la protection des formulaires).
 *
 * Primitive commune : Shared écrit les signaux, le détecteur d'activité inhabituelle (Audit) les lit par ce port.
 * Aucune adresse IP en clair : le client est un condensé court, suffisant pour regrouper une rafale.
 */
interface AbuseSignals
{
    public const RATE_LIMITED = 'rate_limited';
    public const FORM_REJECTED = 'form_rejected';
    public const FORM_CHALLENGED = 'form_challenged';

    public function record(string $kind, string $rule, string $client): void;

    /** @return array<string, int> nombre de signaux par type depuis `$since` */
    public function countsSince(\DateTimeImmutable $since): array;

    /**
     * Rafales : couples (type, règle, client) ayant produit au moins `$threshold` signaux depuis `$since`.
     *
     * @return list<array{kind: string, rule: string, client: string, count: int}>
     */
    public function burstsSince(\DateTimeImmutable $since, int $threshold): array;
}
