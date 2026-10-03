<?php

declare(strict_types=1);

namespace Citizen\Domain;

/**
 * Heure légale de Nova Terra pour les rendez-vous (F39) : les dates sont stockées en UTC et toujours présentées
 * avec ce fuseau, nommé en clair, pour qu'un créneau ne soit jamais ambigu. Fuseau retenu : La Réunion (UTC+4,
 * sans heure d'été), à confirmer (voir doc/rendez-vous.md, questions ouvertes).
 */
final class CityTime
{
    public const TIMEZONE = 'Indian/Reunion';
    public const TIMEZONE_LABEL = 'heure de La Réunion (UTC+4)';

    private const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    private const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    public static function zone(): \DateTimeZone
    {
        return new \DateTimeZone(self::TIMEZONE);
    }

    public static function local(\DateTimeImmutable $at): \DateTimeImmutable
    {
        return $at->setTimezone(self::zone());
    }

    /** Date et heure locales saisies par un agent (`2026-10-12`, `09:30`), converties en UTC. */
    public static function parse(string $date, string $time): \DateTimeImmutable
    {
        $local = \DateTimeImmutable::createFromFormat('!Y-m-d H:i', $date . ' ' . $time, self::zone());
        if ($local === false || $local->format('Y-m-d H:i') !== $date . ' ' . $time) {
            throw new \DomainException('Invalid date or time.');
        }

        return $local->setTimezone(new \DateTimeZone('UTC'));
    }

    /** Début et fin (exclue) d'une journée locale, en UTC. @return array{\DateTimeImmutable, \DateTimeImmutable} */
    public static function day(string $date): array
    {
        $start = self::parse($date, '00:00');

        return [$start, $start->modify('+1 day')];
    }

    /** « lundi 12 octobre 2026 à 9 h 30 » (heure locale). */
    public static function describe(\DateTimeImmutable $at): string
    {
        $local = self::local($at);

        return sprintf(
            '%s %d %s %s à %d h %s',
            self::DAYS[(int) $local->format('w')],
            (int) $local->format('j'),
            self::MONTHS[(int) $local->format('n') - 1],
            $local->format('Y'),
            (int) $local->format('G'),
            $local->format('i'),
        );
    }
}
