<?php

declare(strict_types=1);

namespace Audit\Application\DTO\Security;

/**
 * F85 : verrouillages de connexion (F37) regroupés par cible, fournis par IAM.
 * `scope` : `account` / `pair` (un compte visé) ou `ip` (une adresse qui essaie de nombreux comptes).
 * `label` est déjà masqué (`j•••@domaine`, `192.168.1.x`) ; `accountId` vaut null si le compte n'existe pas.
 */
final readonly class BlockedLoginSignal
{
    public function __construct(
        public string $scope,
        public string $targetKey,
        public string $label,
        public ?string $accountId,
        public int $lockouts,
        public int $failures,
    ) {}
}
