<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Catalogue des services municipaux, tenu par Administration : Citizen n'en lit que ce dont un rendez-vous a besoin. */
interface MunicipalServiceDirectory
{
    public function find(string $serviceId): ?MunicipalServiceSummary;

    /** @return list<MunicipalServiceSummary> tout le catalogue, pour le choix d'un service par un agent */
    public function all(): array;
}
