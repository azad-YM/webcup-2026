<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Participation;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Participation\Application\Ports\Provider\ParticipationAccessPolicy;

/** Participation asks Administration: active member holding `admin.participation.read` / `admin.participation.write`. */
final readonly class AdminParticipationAccessPolicy implements ParticipationAccessPolicy
{
    public const READ = 'admin.participation.read';
    public const WRITE = 'admin.participation.write';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canRead(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::READ]));
    }

    public function canWrite(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::WRITE]));
    }
}
