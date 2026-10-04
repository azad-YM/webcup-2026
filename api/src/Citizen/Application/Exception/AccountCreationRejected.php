<?php

declare(strict_types=1);

namespace Citizen\Application\Exception;

/** Contrat du port CitizenAccountProvisioner : e-mail ou mot de passe refusés par le fournisseur (422). */
final class AccountCreationRejected extends \DomainException
{
    public function __construct()
    {
        parent::__construct('The email or password is invalid.');
    }
}
