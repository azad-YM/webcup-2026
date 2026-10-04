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
        /** @var array{revealed: bool, canReveal: bool} F70 */
        public array $sensitive = ['revealed' => false, 'canReveal' => false],
        /** F80 : demandes non closes de priorité `urgent`, quel que soit le filtre. */
        public int $urgentCount = 0,
        /** @var list<array{id: string, reference: string, subject: string, createdAt: string}> F86 : urgences médicales non prises en charge */
        public array $pendingEmergencies = [],
    ) {}
}
