<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

/** Changement interne au traitement (priorité, prise en charge d'une urgence, groupe) : `change` le nomme. */
final readonly class ServiceRequestUpdated implements DomainEvent
{
    public function __construct(
        public string $requestId,
        public string $citizenId,
        public string $reference,
        public string $change,
    ) {}
}
