<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Export;

/** Contrat de `ExportDataSource` : période (jours entiers) et filtre de statut. */
final readonly class ExportCriteria
{
    public function __construct(
        public ?\DateTimeImmutable $from = null,
        /** Fin de période exclusive (lendemain du dernier jour choisi). */
        public ?\DateTimeImmutable $until = null,
        public ?string $status = null,
        public int $limit = 10000,
    ) {}

    /** Bornes SQL `[from, until)` au format `Y-m-d H:i:s` (null = sans borne). */
    public function sqlFrom(): ?string
    {
        return $this->from?->format('Y-m-d H:i:s');
    }

    public function sqlUntil(): ?string
    {
        return $this->until?->format('Y-m-d H:i:s');
    }
}
