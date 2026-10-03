<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Citizen;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;

/** Citizen asks Administration: the connected account must be an active member holding the request permissions. */
final readonly class AdminRequestAccessPolicy implements RequestAccessPolicy
{
    public const READ = 'admin.request.read';
    public const WRITE = 'admin.request.write';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canReadRequests(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::READ]));
    }

    public function canProcessRequests(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::READ, self::WRITE]));
    }
}
