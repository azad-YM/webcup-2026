<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\IAM;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use IAM\Application\Ports\Provider\SecurityJournalAccessPolicy;

/** IAM asks Administration: the connected account must be an active member holding `admin.security.read`. */
final readonly class AdminSecurityJournalAccessPolicy implements SecurityJournalAccessPolicy
{
    public const PERMISSION = 'admin.security.read';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canReadSecurityJournal(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }
}
