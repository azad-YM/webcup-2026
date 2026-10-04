<?php

declare(strict_types=1);

namespace Participation\Application\Support;

use Shared\Domain\Exception\DomainException;

final class Dates
{
    /** ISO 8601 date-time received from the HTTP payload. */
    public static function parse(string $value, string $label): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            throw new DomainException(sprintf('%s : date invalide (ISO 8601 attendu).', $label));
        }
    }
}
