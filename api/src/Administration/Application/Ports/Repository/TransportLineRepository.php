<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Repository;

use Administration\Domain\Entity\TransportLine;

/** F97 : lignes de transport. Sans `flush` : le `command.bus` valide. */
interface TransportLineRepository
{
    public function save(TransportLine $line): void;

    public function find(string $id): ?TransportLine;

    /** @return list<TransportLine> par numéro de ligne */
    public function all(): array;
}
