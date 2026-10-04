<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Provider;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
final class StubCitizenAccountManager implements CitizenAccountManager
{
    public array $statuses = [];
    public bool $validPassword = true;
    public function emails(array $userIds): array { $emails = []; foreach ($userIds as $id) $emails[$id] = $id.'@example.com'; return $emails; }
    public function verifyPassword(string $userId, string $password): bool { return $this->validPassword; }
    public function delete(string $userId): void { $this->statuses[$userId] = 'deleted'; }
    public function suspend(string $userId, bool $suspended): void { $this->statuses[$userId] = $suspended ? 'suspended' : 'active'; }
}
