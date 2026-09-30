<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Provider;

use IAM\Application\Exception\AccountAlreadyExists;
use IAM\Application\Exception\AccountCreationRejected;

interface MemberAccountProvisioner
{
    /**
     * @return string The new account identifier.
     * @throws AccountAlreadyExists
     * @throws AccountCreationRejected
     */
    public function create(string $email, string $name, #[\SensitiveParameter] string $password): string;
}
