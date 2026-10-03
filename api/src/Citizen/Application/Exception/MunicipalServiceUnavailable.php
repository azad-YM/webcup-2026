<?php

declare(strict_types=1);

namespace Citizen\Application\Exception;

use Citizen\Application\Ports\Provider\MunicipalServiceSummary;
use Shared\Domain\Exception\ConflitException;

/** Erreur contractuelle (409) : le service visé est désactivé par la mairie (F63) ; aucune demande ni réservation. */
final class MunicipalServiceUnavailable extends ConflitException
{
    public static function for(MunicipalServiceSummary $service): self
    {
        $reason = trim($service->disabledReason);

        return new self(sprintf(
            'Le service « %s » est momentanément désactivé par la mairie%s. Vous ne pouvez pas envoyer de nouvelle demande ni réserver de rendez-vous pour ce service. Contactez la mairie (%s%s) ou réessayez plus tard.',
            $service->name,
            $reason !== '' ? ' : ' . rtrim($reason, '.') : '',
            $service->place !== '' ? $service->place : 'accueil de l’hôtel de ville',
            $service->hours !== '' ? ', ' . $service->hours : '',
        ));
    }
}
