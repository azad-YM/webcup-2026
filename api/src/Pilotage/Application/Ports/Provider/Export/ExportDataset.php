<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Export;

/** Contrat de `ExportDataSource` : description d'un jeu de données exportable. */
final readonly class ExportDataset
{
    /**
     * @param list<ExportColumn>    $columns
     * @param array<string, string> $statuses filtre « statut » proposé (valeur => libellé), vide si sans objet
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $description,
        public array $columns,
        public array $statuses = [],
        /** Libellé de la date sur laquelle porte la période, ou null si la période ne s'applique pas. */
        public ?string $periodLabel = 'Date de création',
    ) {}
}
