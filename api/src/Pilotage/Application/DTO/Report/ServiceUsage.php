<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `CitizenReportProvider::serviceUsage` (F98) : usages d'un service sur une période, comptés par Citizen. */
final readonly class ServiceUsage
{
    public function __construct(
        public string $serviceId,
        /** Demandes et signalements adressés à ce service. */
        public int $requests,
        /** Rendez-vous pris (hors annulés). */
        public int $appointments,
        /** Habitants distincts (demandes et rendez-vous confondus). */
        public int $citizens,
    ) {}
}
