<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Audit;

use Administration\Application\Ports\Provider\CurrentAccountProvider;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessHandler;
use Administration\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessQuery;
use Audit\Application\Ports\Provider\AuditAccessPolicy;

/**
 * Audit asks Administration: `admin.audit.read` opens the journal, `admin.security.read` adds the blocked logins;
 * F100 : every active member follows the (masked) latest security events.
 */
final readonly class AdminAuditAccessPolicy implements AuditAccessPolicy
{
    public const PERMISSION = 'admin.audit.read';
    public const SECURITY_PERMISSION = 'admin.security.read';

    public function __construct(
        private CheckCurrentMemberPermissionsHandler $permissions,
        private CurrentAccountProvider $currentAccount,
        private GetMemberSpaceAccessHandler $spaceAccess,
    ) {}

    public function canReadAuditTrail(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]));
    }

    public function canReadSecurityEntries(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::SECURITY_PERMISSION]));
    }

    public function canReadSecurityEvents(): bool
    {
        return ($this->spaceAccess)(new GetMemberSpaceAccessQuery($this->currentAccount->userId())) !== null;
    }
}
