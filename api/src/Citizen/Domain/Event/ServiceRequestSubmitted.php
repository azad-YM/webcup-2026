<?php

declare(strict_types=1);

namespace Citizen\Domain\Event;

use Shared\Domain\Event\DomainEvent;

final readonly class ServiceRequestSubmitted implements DomainEvent
{
    public function __construct(
        public string $requestId,
        public string $citizenId,
        public string $reference,
        /** F86 : urgence médicale cochée ou détectée — alerte immédiate des agents. */
        public bool $medicalEmergency = false,
        public string $priority = 'normal',
    ) {}
}
