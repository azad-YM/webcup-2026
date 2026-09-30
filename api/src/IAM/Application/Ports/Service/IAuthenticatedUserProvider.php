<?php

namespace IAM\Application\Ports\Service;

use Shared\Domain\VO\AuthenticatedUser;

interface IAuthenticatedUserProvider
{
    public function getUser(): AuthenticatedUser;
}
