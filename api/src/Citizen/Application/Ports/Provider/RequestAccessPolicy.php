<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Droits du compte connecté sur la file des demandes, décidés par Administration (permissions des agents). */
interface RequestAccessPolicy
{
    /** Consulter la file des demandes et le compteur « en attente ». */
    public function canReadRequests(): bool;

    /** Changer le statut d'une demande. */
    public function canProcessRequests(): bool;
}
