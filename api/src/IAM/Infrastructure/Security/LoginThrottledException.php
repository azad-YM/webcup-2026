<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use Symfony\Component\Security\Core\Exception\AuthenticationException;
final class LoginThrottledException extends AuthenticationException
{
    public function __construct(public readonly int $retryAfter) { parent::__construct('Too many login attempts.'); }
}
