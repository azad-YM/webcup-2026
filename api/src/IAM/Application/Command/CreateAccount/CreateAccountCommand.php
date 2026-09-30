<?php

declare(strict_types=1);

namespace IAM\Application\Command\CreateAccount;

final readonly class CreateAccountCommand
{
    public function __construct(public string $email, public string $name, #[\SensitiveParameter] public string $password) {}
    public function __debugInfo(): array { return ['email' => $this->email, 'name' => $this->name, 'password' => '[redacted]']; }
}
