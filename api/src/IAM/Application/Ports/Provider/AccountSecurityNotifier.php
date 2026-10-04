<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Provider;

/**
 * F54 : prévenir le titulaire d'un compte dans son espace (port d'IAM, consommateur).
 * Implémenté par Citizen (`Citizen/Infrastructure/Adapter/IAM/CitizenAccountSecurityNotifier`), qui crée une
 * notification de l'espace citoyen ; sans profil citoyen (compte d'agent), rien n'est créé.
 * Doit être idempotent pour un même `deviceId` (redélivrance de l'événement).
 */
interface AccountSecurityNotifier
{
    public function newDeviceSignedIn(string $userId, string $deviceId, string $deviceLabel, \DateTimeImmutable $at): void;
}
