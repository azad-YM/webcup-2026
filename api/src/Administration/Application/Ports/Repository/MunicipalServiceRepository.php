<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Repository;

use Administration\Domain\Entity\MunicipalService;

interface MunicipalServiceRepository
{
    public function save(MunicipalService $service): void;

    public function find(string $id): ?MunicipalService;

    /** @return list<MunicipalService> */
    public function all(): array;
}
