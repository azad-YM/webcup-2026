<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/**
 * F55 : ce que le compte de connexion sait du citoyen, et la confirmation d'identité avant l'export.
 * Port de Citizen implémenté par IAM (`IAM/Infrastructure/Adapter/Citizen/IAMPersonalAccountDataProvider`).
 * Aucun mot de passe, empreinte, jeton ou code ne traverse ce port.
 */
interface PersonalAccountDataProvider
{
    /**
     * Mot de passe, ou code reçu par e-mail (`challengeId` + `code`, demandé à IAM par
     * `POST /api/iam/me/reconfirmation-codes`). Un essai de code manqué est enregistré par IAM : l'appelant ne
     * doit pas annuler sa transaction sur un refus.
     */
    public function reconfirm(string $userId, ?string $password, ?string $challengeId, ?string $code): AccountReconfirmation;

    public function accountData(string $userId): PersonalAccountData;
}
