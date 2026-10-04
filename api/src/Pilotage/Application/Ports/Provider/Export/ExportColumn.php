<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Export;

/** Contrat de `ExportDataSource` : une colonne exportable, avec son en-tête en français. */
final readonly class ExportColumn
{
    public function __construct(
        public string $key,
        public string $label,
        /** Donnée personnelle sensible : exportée seulement avec `admin.sensitive-data.read`. */
        public bool $sensitive = false,
        /** Cochée par défaut dans l'écran. */
        public bool $selected = true,
    ) {}
}
