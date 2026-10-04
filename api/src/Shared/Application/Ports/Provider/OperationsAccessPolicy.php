<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Provider;

/**
 * F87 (ADR 012) : qui peut consulter les écrans d'exploitation de la plateforme (rapports de sauvegarde).
 * Implémenté par le BC qui possède les agents et leurs permissions (Administration, `admin.backup.read`).
 */
interface OperationsAccessPolicy
{
    public function canReadBackups(): bool;
}
