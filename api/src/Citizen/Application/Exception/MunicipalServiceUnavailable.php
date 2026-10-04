<?php

declare(strict_types=1);

namespace Citizen\Application\Exception;

use Citizen\Application\Ports\Provider\MunicipalServiceSummary;
use Shared\Application\Exception\ApiException;

/**
 * Erreur contractuelle (409, code `service_disabled`) : le service visé est désactivé par la mairie (F63) ;
 * aucune nouvelle demande ni réservation. Le message, en français, dit quoi faire à la place ; `details.serviceId`
 * identifie le service.
 */
final class MunicipalServiceUnavailable extends ApiException
{
    public const CODE = 'service_disabled';

    public static function for(MunicipalServiceSummary $service): self
    {
        $reason = trim($service->disabledReason);

        return new self(sprintf(
            'Le service « %s » est momentanément désactivé par la mairie%s. Vous ne pouvez pas envoyer de nouvelle demande ni réserver de rendez-vous pour ce service. Contactez la mairie (%s%s) ou réessayez plus tard.',
            $service->name,
            $reason !== '' ? ' : ' . rtrim($reason, '.') : '',
            $service->place !== '' ? $service->place : 'accueil de l’hôtel de ville',
            $service->hours !== '' ? ', ' . $service->hours : '',
        ), 409, self::CODE, ['serviceId' => $service->id]);
    }
}
