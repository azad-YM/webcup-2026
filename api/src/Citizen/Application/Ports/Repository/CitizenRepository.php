<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\Citizen;

interface CitizenRepository
{
    public function save(Citizen $citizen): void;
    public function findByUserId(string $userId): ?Citizen;
}
