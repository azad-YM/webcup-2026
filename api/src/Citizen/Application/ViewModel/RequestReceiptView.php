<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

/** F83 : accusé de réception d'une demande (référence, date, service, objet, empreinte). */
final readonly class RequestReceiptView
{
    public function __construct(
        public string $reference,
        public string $type,
        public string $subject,
        public ?string $serviceId,
        public ?string $serviceName,
        public string $submittedAt,
        public string $fingerprint,
        public bool $medicalEmergency,
    ) {}
}
