<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

interface CitizenAccountManager
{
    public function email(string $userId): ?string;
    public function verifyPassword(string $userId, string $password): bool;
    public function delete(string $userId): void;
    public function suspend(string $userId, bool $suspended): void;
}
