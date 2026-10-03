<?php

declare(strict_types=1);

namespace Communication\Domain;

use Shared\Domain\Exception\DomainException;

/** Text rules shared by the communications of the city. */
final class Text
{
    public static function required(string $value, int $max, string $label): string
    {
        $value = trim($value);
        if ($value === '' || mb_strlen($value) > $max) {
            throw new DomainException(sprintf('%s requis (%d caractères maximum).', $label, $max));
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
}
