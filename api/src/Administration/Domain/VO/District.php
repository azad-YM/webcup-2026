<?php

declare(strict_types=1);

namespace Administration\Domain\VO;

/**
 * Closed list of the districts of Nova Terra, owned by Administration.
 * Citizen (profile) and Communication (targeted alerts) validate against it through their own ports.
 */
final class District
{
    public const ALL = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre', 'Port'];

    public static function exists(string $name): bool
    {
        return in_array($name, self::ALL, true);
    }
}
