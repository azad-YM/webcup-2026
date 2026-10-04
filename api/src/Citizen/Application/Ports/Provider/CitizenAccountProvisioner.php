<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Exception\AccountCreationRejected;

/** Création du compte de connexion d'un nouveau citoyen, dans la transaction courante. */
interface CitizenAccountProvisioner
{
    /**
     * @return string The new account identifier.
     * @throws AccountAlreadyExists
     * @throws AccountCreationRejected
     */
    public function create(string $email, #[\SensitiveParameter] string $password): string;
}
