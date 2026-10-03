<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

/** File des agents : une page de demandes, le compteur « en attente » (statut `submitted`) et la capacité de traiter. */
final readonly class RequestQueue
{
    /** @param list<ServiceRequestView> $items */
    public function __construct(
        public array $items,
        public int $total,
        public int $pendingCount,
        public int $page,
        public int $pageSize,
        public bool $canProcess,
    ) {}
}
