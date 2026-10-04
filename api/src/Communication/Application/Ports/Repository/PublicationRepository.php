<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Repository;

use Communication\Domain\Entity\Publication;

interface PublicationRepository
{
    public function save(Publication $publication): void;

    public function find(string $id): ?Publication;

    /** @return list<Publication> */
    public function all(): array;
}
