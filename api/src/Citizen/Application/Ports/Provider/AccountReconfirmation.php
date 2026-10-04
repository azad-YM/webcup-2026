<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Résultat contractuel de `PersonalAccountDataProvider::reconfirm()`. */
final readonly class AccountReconfirmation
{
    public const CONFIRMED = 'confirmed';
    public const INVALID_PASSWORD = 'invalid_password';
    public const INVALID_CODE = 'invalid_code';
    public const CODE_EXPIRED = 'code_expired';
    public const TOO_MANY_ATTEMPTS = 'too_many_attempts';
    public const MISSING = 'missing';

    public function __construct(public string $result, public int $remainingAttempts = 0) {}

    public function confirmed(): bool { return $this->result === self::CONFIRMED; }
}
