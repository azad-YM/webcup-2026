<?php

declare(strict_types=1);

namespace Assistance\Application\Ports\Provider;

/**
 * Catalogue des services municipaux lu par l'assistance (D10, F91, F92). Assistance ne possède pas le catalogue :
 * implémenté par Administration (`Administration/Infrastructure/Adapter/Assistance/AdminAssistanceServiceCatalog`).
 */
interface ServiceCatalog
{
    /** @return list<CatalogService> tous les services publiés, y compris désactivés ou perturbés (leur état est porté) */
    public function services(): array;
}
