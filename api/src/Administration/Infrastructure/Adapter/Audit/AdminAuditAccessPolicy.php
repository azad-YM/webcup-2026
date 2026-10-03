<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Audit;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Audit\Application\Ports\Provider\AuditAccessPolicy;

/** Audit asks Administration: `admin.audit.read` opens the journal, `admin.security.read` adds the blocked logins. */
final readonly class AdminAuditAccessPolicy implements AuditAccessPolicy
{
    public const PERMISSION = 'admin.audit.read';
    public const SECURITY_PERMISSION = 'admin.security.read';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canReadAuditTrail(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }

    public function canReadSecurityEntries(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::SECURITY_PERMISSION]));
    }
}
