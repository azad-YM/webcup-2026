<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Repository;

use Pilotage\Domain\Entity\RequestTracking;

interface RequestTrackingRepository
{
    public function find(string $requestCode): ?RequestTracking;

    /** @return array<string, RequestTracking> indexed by request code */
    public function all(): array;

    /** Persists without flushing: the command bus transaction commits. */
    public function save(RequestTracking $tracking): void;
}
