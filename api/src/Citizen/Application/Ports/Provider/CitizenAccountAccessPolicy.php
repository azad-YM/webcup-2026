<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

interface CitizenAccountAccessPolicy
{
    public function canReadAccounts(): bool;
    public function canManageAccounts(): bool;
    /** Active administration memberships protect the shared login account. */
    public function isProtectedAccount(string $userId): bool;
}
