<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Pilotage;

use Citizen\Domain\Entity\ServiceRequest;
use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Activity\CitizenActivity;
use Pilotage\Application\Ports\Provider\Activity\CitizenActivityProvider;

/** Port of the Pilotage dashboard implemented by Citizen: counts on its own tables only. */
final readonly class CitizenPilotageActivity implements CitizenActivityProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function citizenActivity(\DateTimeImmutable $since): CitizenActivity
    {
        $db = $this->manager->getConnection();
        $sinceSql = $since->format('Y-m-d H:i:s');
        $citizens = $db->fetchAssociative(
            "SELECT SUM(status = 'active') AS active, SUM(status = 'suspended') AS suspended, SUM(registered_at >= ? AND status <> 'deleted') AS recent FROM citizens",
            [$sinceSql],
        ) ?: [];
        $byStatus = array_fill_keys(ServiceRequest::STATUSES, 0);
        foreach ($db->fetchAllAssociative('SELECT status, COUNT(*) AS total FROM citizen_service_requests GROUP BY status') as $row) {
            $byStatus[(string) $row['status']] = (int) $row['total'];
        }
        $oldest = $db->fetchOne('SELECT MIN(created_at) FROM citizen_service_requests WHERE status = ?', [ServiceRequest::SUBMITTED]);

        return new CitizenActivity(
            (int) ($citizens['active'] ?? 0),
            (int) ($citizens['suspended'] ?? 0),
            (int) ($citizens['recent'] ?? 0),
            $byStatus,
            $byStatus[ServiceRequest::SUBMITTED] ?? 0,
            ($byStatus[ServiceRequest::SUBMITTED] ?? 0) + ($byStatus[ServiceRequest::ACKNOWLEDGED] ?? 0) + ($byStatus[ServiceRequest::IN_PROGRESS] ?? 0),
            (int) $db->fetchOne('SELECT COUNT(*) FROM citizen_service_requests WHERE created_at >= ?', [$sinceSql]),
            is_string($oldest) ? new \DateTimeImmutable($oldest) : null,
        );
    }
}
