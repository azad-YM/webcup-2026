<?php

declare(strict_types=1);

namespace IAM\Application\Command\CreateResidentAccount;

/**
 * F71: account of a resident created by an agent at the city reception, with or without e-mail.
 * IAM generates the resident identifier and the provisional access code.
 */
final readonly class CreateResidentAccountCommand
{
    public function __construct(public string $name, public ?string $email = null) {}
}
