<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider;

/** Decides what the connected account may do in Pilotage. Implemented by the BC that owns the agents. */
interface PilotageAccessPolicy
{
    /** Read the contest feed and its tracking (`admin.pilotage.read`). */
    public function canReadWebcupFeed(): bool;

    /** Update the team tracking of the contest requests (`admin.pilotage.write`). */
    public function canEditTracking(): bool;

    /** Read the activity dashboard of the platform (`admin.pilotage.read`). */
    public function canReadActivityDashboard(): bool;

    /** Export tracking data from the "Exports" screen (`admin.export.read`, F88). */
    public function canExportData(): bool;

    /** Include sensitive personal data columns in an export (`admin.sensitive-data.read`). */
    public function canExportSensitiveData(): bool;
}
