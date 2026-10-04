<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Participation;

use Administration\Application\Query\GetMunicipalService\GetMunicipalServiceHandler;
use Administration\Application\Query\GetMunicipalService\GetMunicipalServiceQuery;
use Participation\Application\Ports\Provider\ReviewedServiceDirectory;
use Shared\Domain\Exception\NotFoundException;

/** F76 : Participation vérifie dans le catalogue d'Administration qu'un service évalué existe et lit son nom. */
final readonly class AdminParticipationServiceDirectory implements ReviewedServiceDirectory
{
    public function __construct(private GetMunicipalServiceHandler $services) {}

    public function nameOf(string $serviceId): ?string
    {
        try {
            $view = ($this->services)(new GetMunicipalServiceQuery($serviceId));
        } catch (NotFoundException) {
            return null;
        }

        return (string) $view['name'];
    }
}
