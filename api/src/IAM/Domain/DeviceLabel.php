<?php

declare(strict_types=1);

namespace IAM\Domain;

/** Résumé lisible « Navigateur sur système » déduit de l'en-tête User-Agent (F54). Non persisté seul. */
final class DeviceLabel
{
    public const UNKNOWN = 'Appareil non identifié';

    public static function fromUserAgent(?string $userAgent): string
    {
        $ua = (string) $userAgent;
        if (trim($ua) === '') return self::UNKNOWN;
        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'SamsungBrowser') => 'Samsung Internet',
            str_contains($ua, 'Firefox/') || str_contains($ua, 'FxiOS') => 'Firefox',
            str_contains($ua, 'Chrome/') || str_contains($ua, 'CriOS') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Navigateur inconnu',
        };
        $system = match (true) {
            str_contains($ua, 'iPhone') => 'iPhone',
            str_contains($ua, 'iPad') => 'iPad',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'macOS',
            str_contains($ua, 'CrOS') => 'ChromeOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'système inconnu',
        };

        return $browser.' sur '.$system;
    }
}
