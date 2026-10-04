<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Citizen;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Citizen\Application\Ports\Provider\SensitiveDataAccessPolicy;

/** F70 : membre actif détenant `admin.sensitive-data.read` (administrateur principal ; rôle dédié à attribuer). */
final readonly class AdminSensitiveDataAccessPolicy implements SensitiveDataAccessPolicy
{
    public const PERMISSION = 'admin.sensitive-data.read';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canRevealSensitiveData(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }
}
