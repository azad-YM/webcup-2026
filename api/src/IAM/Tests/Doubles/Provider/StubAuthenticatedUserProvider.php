<?php

declare(strict_types=1);

namespace Tests\IAM\Doubles\Provider;

use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use Shared\Domain\VO\AuthenticatedUser;

final readonly class StubAuthenticatedUserProvider implements IAuthenticatedUserProvider
{
    public function __construct(private string $userId) {}

    public function getUser(): AuthenticatedUser
    {
        return new AuthenticatedUser($this->userId);
    }
}
