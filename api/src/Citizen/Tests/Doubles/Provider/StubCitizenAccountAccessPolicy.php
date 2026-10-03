<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Provider;

use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
final class StubCitizenAccountAccessPolicy implements CitizenAccountAccessPolicy
{
    public bool $read = true;
    public bool $manage = true;
    public array $protected = [];
    public function canReadAccounts(): bool { return $this->read; }
    public function canManageAccounts(): bool { return $this->manage; }
    public function isProtectedAccount(string $userId): bool { return in_array($userId, $this->protected, true); }
}
