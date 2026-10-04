<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\AlertPreference;

interface AlertPreferenceRepository
{
    /** Returns the stored preference, or a default one (no consent) that is not persisted yet. */
    public function get(string $citizenId): AlertPreference;

    public function save(AlertPreference $preference): void;
}
