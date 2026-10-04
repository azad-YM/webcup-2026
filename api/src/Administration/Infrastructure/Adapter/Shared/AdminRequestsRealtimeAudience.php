<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Shared;

use Administration\Application\Query\CheckMemberPermissions\CheckMemberPermissionsHandler;
use Administration\Application\Query\CheckMemberPermissions\CheckMemberPermissionsQuery;
use Administration\Infrastructure\Adapter\Citizen\AdminRequestAccessPolicy;
use Shared\Application\Ports\Provider\RealtimeAudienceProvider;

/** Agents allowed to read the request queue listen to `administration.requests` (new requests, status changes). */
final readonly class AdminRequestsRealtimeAudience implements RealtimeAudienceProvider
{
    public const TOPIC = 'administration.requests';

    public function __construct(private CheckMemberPermissionsHandler $permissions) {}

    public function topicsFor(string $userId): array
    {
        return ($this->permissions)(new CheckMemberPermissionsQuery($userId, [AdminRequestAccessPolicy::READ])) ? [self::TOPIC] : [];
    }
}
