<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Communication;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Communication\Application\Ports\Provider\CommunicationAccessPolicy;

/** Communication asks Administration: the connected account must be an active member holding `admin.communication.write`. */
final readonly class AdminCommunicationAccessPolicy implements CommunicationAccessPolicy
{
    public const PERMISSION = 'admin.communication.write';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canPublish(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }
}
