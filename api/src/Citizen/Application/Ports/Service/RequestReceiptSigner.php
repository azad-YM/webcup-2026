<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Service;

/** F83 : empreinte courte d'un accusé de réception, vérifiable sans révéler le contenu de la demande. */
interface RequestReceiptSigner
{
    /** Empreinte stable (ex. `7K2QF-9XM4A`) calculée à partir des seules données passées, avec un secret serveur. */
    public function fingerprint(string $payload): string;
}
