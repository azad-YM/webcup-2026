<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Service;

use Citizen\Application\Ports\Service\ServiceRequestReferenceGenerator;
use Doctrine\DBAL\Connection;

/**
 * Numéro suivant de l'année, lu dans `citizen_service_requests` sous verrou (`FOR UPDATE` sur la plage
 * de références de l'année) pendant la transaction du command.bus. L'index unique sur `reference` reste
 * la garantie finale : un envoi concurrent exceptionnel échoue plutôt que de dupliquer une référence.
 */
final readonly class SqlServiceRequestReferenceGenerator implements ServiceRequestReferenceGenerator
{
    public function __construct(private Connection $connection) {}

    public function next(\DateTimeImmutable $at): string
    {
        $prefix = sprintf('NT-%s-', $at->format('Y'));
        $last = $this->connection->fetchOne(
            'SELECT MAX(CAST(SUBSTRING(reference, :start) AS UNSIGNED)) FROM citizen_service_requests WHERE reference LIKE :prefix FOR UPDATE',
            ['start' => strlen($prefix) + 1, 'prefix' => $prefix . '%'],
        );

        return sprintf('%s%04d', $prefix, ((int) $last) + 1);
    }
}
