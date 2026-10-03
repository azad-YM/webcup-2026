<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Provider;

use Administration\Application\Exception\AccountAlreadyExists;
use Administration\Application\Exception\AccountCreationRejected;

interface MemberAccountProvisioner
{
    /**
     * @return string The new account identifier.
     * @throws AccountAlreadyExists
     * @throws AccountCreationRejected
     */
    public function create(string $email, string $name, #[\SensitiveParameter] string $password): string;
}
