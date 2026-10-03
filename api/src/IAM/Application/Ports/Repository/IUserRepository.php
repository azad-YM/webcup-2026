<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\User;

interface IUserRepository
{
    public function findById(string $id): ?User;
    public function save(User $user): void;
    public function findByEmail(string $email): ?User;
}
