<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Pilotage;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;

/** Pilotage asks Administration: the connected account must be an active member holding the Pilotage permission. */
final readonly class AdminPilotageAccessPolicy implements PilotageAccessPolicy
{
    public const PERMISSION = 'admin.pilotage.read';
    public const WRITE_PERMISSION = 'admin.pilotage.write';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canReadWebcupFeed(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }

    public function canEditTracking(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::WRITE_PERMISSION]));
    }

    public function canReadActivityDashboard(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }
}
