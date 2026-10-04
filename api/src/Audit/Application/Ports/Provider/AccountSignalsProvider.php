<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Provider;

use Audit\Application\DTO\Security\AccountSignal;
use Audit\Application\DTO\Security\BlockedLoginSignal;

/**
 * F85 : signaux de connexion pour le détecteur d'activité inhabituelle. Implémenté par IAM sur ses propres tables
 * (`iam_login_security_events`, `iam_known_devices`, `iam_sign_ins`, `auth_users`). Libellés déjà masqués.
 */
interface AccountSignalsProvider
{
    /** @return list<BlockedLoginSignal> verrouillages depuis `$since`, regroupés par cible */
    public function blockedLoginsSince(\DateTimeImmutable $since): array;

    /** @return list<AccountSignal> comptes ayant ajouté au moins `$minimum` nouveaux appareils depuis `$since` */
    public function newDevicesSince(\DateTimeImmutable $since, int $minimum): array;

    /** @return list<AccountSignal> comptes suspendus ou supprimés ayant pourtant une connexion réussie depuis `$since` */
    public function inactiveAccountsSignedInSince(\DateTimeImmutable $since): array;

    /**
     * @param list<string> $accountIds
     * @return list<AccountSignal> parmi ces comptes, ceux encore actifs côté IAM (count = 0)
     */
    public function activeAmong(array $accountIds): array;
}
