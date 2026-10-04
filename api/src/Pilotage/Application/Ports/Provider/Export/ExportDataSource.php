<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Export;

use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * F88 : un BC propriétaire met à disposition un ou plusieurs jeux de données de suivi pour l'écran « Exports ».
 * Implémenté dans l'Infrastructure du propriétaire (`Infrastructure/Adapter/Pilotage`), sur ses seules tables.
 * Pilotage choisit les colonnes, masque les colonnes sensibles, met en forme (CSV / JSON) et journalise.
 */
#[AutoconfigureTag('pilotage.export_source')]
interface ExportDataSource
{
    /** @return list<ExportDataset> jeux de données fournis par ce BC */
    public function datasets(): array;

    /**
     * Lignes du jeu `$dataset` (clé d'une `ExportDataset` de `datasets()`), les plus récentes d'abord,
     * indexées par clé de colonne ; valeurs déjà lisibles (libellés français, dates `Y-m-d H:i`).
     *
     * @return list<array<string, string|int|float|bool|null>>
     */
    public function rows(string $dataset, ExportCriteria $criteria): array;
}
