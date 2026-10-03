<?php

declare(strict_types=1);

namespace Tests\IAM\Doubles\Repository;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;

final class InMemoryUserRepository implements IUserRepository
{
    /** @var array<string, User> */
    private array $users = [];
    public function findById(string $id): ?User { foreach ($this->users as $user) if ($user->getId() === $id) return $user; return null; }
    public function save(User $user): void { $this->users[$user->getUserIdentifier()] = $user; }
    public function findByEmail(string $email): ?User { return $this->users[strtolower($email)] ?? null; }
}
