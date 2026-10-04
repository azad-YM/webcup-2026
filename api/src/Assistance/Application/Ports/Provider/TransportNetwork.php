<?php

declare(strict_types=1);

namespace Assistance\Application\Ports\Provider;

/**
 * F97 : réseau de transport municipal lu par l'assistance (lignes, état, solutions de remplacement).
 * Implémenté par Administration (`Administration/Infrastructure/Adapter/Assistance/AdminAssistanceTransportNetwork`).
 */
interface TransportNetwork
{
    /** @return list<NetworkLine> */
    public function lines(): array;
}
