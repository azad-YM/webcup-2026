<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Shared;

use Administration\Application\Query\CheckMemberPermissions\CheckMemberPermissionsHandler;
use Administration\Application\Query\CheckMemberPermissions\CheckMemberPermissionsQuery;
use Administration\Infrastructure\Adapter\IAM\AdminSecurityJournalAccessPolicy;
use Shared\Application\Ports\Provider\RealtimeAudienceProvider;

/** F85 : les membres ayant `admin.security.read` écoutent `administration.security` (anomalies graves détectées). */
final readonly class AdminSecurityRealtimeAudience implements RealtimeAudienceProvider
{
    public const TOPIC = 'administration.security';

    public function __construct(private CheckMemberPermissionsHandler $permissions) {}

    public function topicsFor(string $userId): array
    {
        return ($this->permissions)(new CheckMemberPermissionsQuery($userId, [AdminSecurityJournalAccessPolicy::PERMISSION])) ? [self::TOPIC] : [];
    }
}
