<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

interface CitizenAccountManager
{
    /**
     * Login e-mails of the given accounts (never any password or hash).
     *
     * @param list<string> $userIds
     * @return array<string, string> userId => e-mail
     */
    public function emails(array $userIds): array;
    public function verifyPassword(string $userId, string $password): bool;
    public function delete(string $userId): void;
    public function suspend(string $userId, bool $suspended): void;
}
