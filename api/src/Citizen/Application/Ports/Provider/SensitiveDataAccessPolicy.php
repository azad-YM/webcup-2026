<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/**
 * F70 : Citizen demande à Administration si le compte connecté peut afficher les données personnelles sensibles
 * des habitants (coordonnées, adresse, lieu d'une demande de contact). Sans ce droit, l'API les masque.
 * Implémenté par `Administration/Infrastructure/Adapter/Citizen/AdminSensitiveDataAccessPolicy`.
 */
interface SensitiveDataAccessPolicy
{
    public function canRevealSensitiveData(): bool;
}
