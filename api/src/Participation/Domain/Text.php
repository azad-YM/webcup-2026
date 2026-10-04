<?php

declare(strict_types=1);

namespace Participation\Domain;

use Shared\Domain\Exception\DomainException;

/** Text rules of the participation contents (projects, consultations, contributions, ideas). */
final class Text
{
    public static function required(?string $value, int $max, string $label): string
    {
        $value = trim((string) $value);
        if ($value === '' || mb_strlen($value) > $max) {
            throw new DomainException(sprintf('%s requis (%d caractères maximum).', $label, $max));
        }

        return $value;
    }

    public static function optional(?string $value, int $max, string $label): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        if (mb_strlen($value) > $max) {
            throw new DomainException(sprintf('%s : %d caractères maximum.', $label, $max));
        }

        return $value;
    }

    /**
     * @param array<mixed> $values
     * @return list<string>
     */
    public static function paragraphs(array $values, string $label, bool $required = true): array
    {
        if (count($values) > 50) {
            throw new DomainException(sprintf('%s : 50 paragraphes maximum.', $label));
        }
        $paragraphs = [];
        foreach ($values as $value) {
            if (!is_string($value) || mb_strlen($value) > 5000) {
                throw new DomainException(sprintf('%s : paragraphe de 5 000 caractères maximum.', $label));
            }
            if (trim($value) !== '') {
                $paragraphs[] = trim($value);
            }
        }
        if ($required && $paragraphs === []) {
            throw new DomainException(sprintf('%s requis.', $label));
        }

        return $paragraphs;
    }

    /** Short public reference derived from the random end of the identifier (UUID v7 starts with the time), e.g. `IDE-1A2B3C4D5E`. */
    public static function reference(string $prefix, string $id): string
    {
        return $prefix . '-' . strtoupper(substr(str_replace('-', '', $id), -10));
    }
}
