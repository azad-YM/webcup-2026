<?php

declare(strict_types=1);

namespace IAM\Application\Exception;

final class AccountCreationRejected extends \DomainException
{
    public function __construct() { parent::__construct('The account details or initial password are invalid.'); }
}
