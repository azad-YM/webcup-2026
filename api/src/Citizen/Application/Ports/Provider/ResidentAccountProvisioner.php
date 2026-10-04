<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Exception\AccountCreationRejected;

/**
 * F71: creation, in the current transaction, of the login account of a resident welcomed at the
 * city reception, with or without e-mail. The provider generates the resident identifier and a
 * provisional access code that the resident must replace at first login.
 */
interface ResidentAccountProvisioner
{
    /**
     * @throws AccountAlreadyExists     the e-mail is already used
     * @throws AccountCreationRejected
     */
    public function createResidentAccount(string $name, ?string $email): ResidentAccountCredentials;
}
