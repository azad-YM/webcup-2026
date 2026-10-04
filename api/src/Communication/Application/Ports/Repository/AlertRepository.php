<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Repository;

use Communication\Domain\Entity\Alert;

interface AlertRepository
{
    public function save(Alert $alert): void;

    public function find(string $id): ?Alert;

    /** @return list<Alert> */
    public function all(): array;
}
