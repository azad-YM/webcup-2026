<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Provider;

use Audit\Application\DTO\Security\ProtectionResult;

/**
 * F85 : réaction perceptible à une attaque sur un compte. Implémenté par IAM, qui réutilise ses protections :
 * verrouillage temporaire des connexions (F37), code par e-mail exigé à la prochaine connexion même sur un appareil
 * de confiance (F53), avertissement du titulaire dans son espace (F54). Idempotent : le rappeler prolonge seulement.
 */
interface AccountProtector
{
    public function protect(string $accountId, int $lockSeconds, int $codeRequiredHours, string $reason): ProtectionResult;
}
