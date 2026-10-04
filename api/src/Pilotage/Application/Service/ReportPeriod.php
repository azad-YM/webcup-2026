<?php

declare(strict_types=1);

namespace Pilotage\Application\Service;

use Shared\Domain\Exception\DomainException;

/**
 * F98, F103 : période d'analyse. `days` (7, 30, 90…) se termine maintenant ; `from`/`to` (jours inclus, AAAA-MM-JJ)
 * prennent le pas. Au plus 366 jours ; par défaut les 30 derniers jours.
 */
final class ReportPeriod
{
    public const DEFAULT_DAYS = 30;
    public const MAX_DAYS = 366;

    /** @return array{0: \DateTimeImmutable, 1: \DateTimeImmutable} */
    public static function resolve(?int $days, ?string $from, ?string $to, \DateTimeImmutable $now): array
    {
        if (($from ?? '') !== '' || ($to ?? '') !== '') {
            $start = self::day($from, 'from') ?? $now->modify(sprintf('-%d days', self::DEFAULT_DAYS))->setTime(0, 0);
            $end = ($to ?? '') !== '' ? self::day($to, 'to')?->modify('+1 day') : $now;
            if ($end === null || $end <= $start) {
                throw new DomainException('La fin de la période doit suivre son début.');
            }
            if ($start->diff($end)->days > self::MAX_DAYS) {
                throw new DomainException(sprintf('Période limitée à %d jours.', self::MAX_DAYS));
            }

            return [$start, min($end, $now)];
        }
        $days = max(1, min(self::MAX_DAYS, $days ?? self::DEFAULT_DAYS));

        return [$now->modify(sprintf('-%d days', $days)), $now];
    }

    private static function day(?string $value, string $name): ?\DateTimeImmutable
    {
        if (($value ?? '') === '') {
            return null;
        }
        $day = \DateTimeImmutable::createFromFormat('!Y-m-d', (string) $value);
        if ($day === false) {
            throw new DomainException(sprintf('Date « %s » invalide : AAAA-MM-JJ attendu.', $name));
        }

        return $day;
    }
}
