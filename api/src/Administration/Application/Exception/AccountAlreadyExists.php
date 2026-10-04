<?php

declare(strict_types=1);

namespace Administration\Application\Exception;

final class AccountAlreadyExists extends \DomainException
{
    public function __construct()
    {
        parent::__construct('An account already exists for this email.');
    }
}
