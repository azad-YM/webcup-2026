<?php

declare(strict_types=1);

namespace IAM\Application\Command\CompleteSignIn;

/** Commande interne (aucune route) : envoyée par `PasswordAuthenticator` une fois le mot de passe vérifié. */
final readonly class CompleteSignInCommand
{
    public function __construct(
        public string $userId,
        public string $method,
        public ?string $deviceId = null,
    ) {}
}
