<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Provider;

/**
 * F76 : existence et nom d'un service municipal évalué par un habitant. Implémenté par Administration
 * (`Administration/Infrastructure/Adapter/Participation/AdminParticipationServiceDirectory`).
 */
interface ReviewedServiceDirectory
{
    /** Nom du service, ou null s'il n'existe pas dans le catalogue. */
    public function nameOf(string $serviceId): ?string;
}
