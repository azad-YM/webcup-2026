<?php

declare(strict_types=1);

namespace Citizen\Application\Exception;

use Shared\Domain\Exception\ConflitException;

/**
 * Contrat du port CitizenAccountProvisioner : un compte existe déjà pour cet e-mail.
 * Étend ConflitException pour être traduit en 409 par l'ExceptionListener
 * (AppController::dispatch ne transforme en 422 que les \DomainException).
 */
final class AccountAlreadyExists extends ConflitException
{
    public function __construct()
    {
        parent::__construct('An account already exists for this email.');
    }
}
