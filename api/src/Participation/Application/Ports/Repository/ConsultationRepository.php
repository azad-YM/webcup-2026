<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Repository;

use Participation\Domain\Entity\Consultation;

interface ConsultationRepository
{
    public function save(Consultation $consultation): void;

    public function find(string $id): ?Consultation;

    /** @return list<Consultation> */
    public function all(): array;
}
