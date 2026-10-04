<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Pilotage;

use Citizen\Domain\Entity\Appointment;
use Citizen\Domain\Entity\ServiceRequest;
use Citizen\Domain\Service\RequestTriage;
use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Report\RequestReport;
use Pilotage\Application\DTO\Report\ServiceUsage;
use Pilotage\Application\Ports\Provider\Report\CitizenReportProvider;

/** F98, F103 : ports du Pilotage implémentés par Citizen, comptes sur ses propres tables uniquement. */
final readonly class CitizenPilotageReport implements CitizenReportProvider
{
    /** Au-delà, le délai moyen de prise en charge est calculé sur les demandes les plus récentes. */
    private const MAX_REQUESTS_FOR_DELAY = 5000;

    public function __construct(private EntityManagerInterface $manager) {}

    public function serviceUsage(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $db = $this->manager->getConnection();
        $range = [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')];
        $usage = [];
        foreach ($db->fetchAllAssociative('SELECT service_id, COUNT(*) AS total FROM citizen_service_requests WHERE service_id IS NOT NULL AND created_at >= ? AND created_at < ? GROUP BY service_id', $range) as $row) {
            $usage[(string) $row['service_id']]['requests'] = (int) $row['total'];
        }
        foreach ($db->fetchAllAssociative('SELECT service_id, COUNT(*) AS total FROM citizen_appointments WHERE status <> ? AND created_at >= ? AND created_at < ? GROUP BY service_id', [Appointment::CANCELLED, ...$range]) as $row) {
            $usage[(string) $row['service_id']]['appointments'] = (int) $row['total'];
        }
        $people = $db->fetchAllAssociative(
            'SELECT service_id, COUNT(DISTINCT citizen_id) AS total FROM ('
            .' SELECT service_id, citizen_id FROM citizen_service_requests WHERE service_id IS NOT NULL AND created_at >= ? AND created_at < ?'
            .' UNION ALL SELECT service_id, citizen_id FROM citizen_appointments WHERE status <> ? AND created_at >= ? AND created_at < ?'
            .') AS uses GROUP BY service_id',
            [...$range, Appointment::CANCELLED, ...$range],
        );
        foreach ($people as $row) {
            $usage[(string) $row['service_id']]['citizens'] = (int) $row['total'];
        }

        return array_map(
            static fn (string $id, array $counts): ServiceUsage => new ServiceUsage($id, $counts['requests'] ?? 0, $counts['appointments'] ?? 0, $counts['citizens'] ?? 0),
            array_keys($usage),
            array_values($usage),
        );
    }

    public function requestReport(\DateTimeImmutable $from, \DateTimeImmutable $to): RequestReport
    {
        $db = $this->manager->getConnection();
        $range = [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')];
        $counts = $db->fetchAssociative(
            'SELECT COUNT(*) AS received, SUM(status = ?) AS resolved, SUM(status = ?) AS rejected, SUM(status = ?) AS waiting, SUM(priority = ?) AS urgent'
            .' FROM citizen_service_requests WHERE created_at >= ? AND created_at < ?',
            [ServiceRequest::RESOLVED, ServiceRequest::REJECTED, ServiceRequest::SUBMITTED, RequestTriage::URGENT, ...$range],
        ) ?: [];
        $delays = [];
        $rows = $db->fetchAllAssociative(sprintf('SELECT created_at, steps FROM citizen_service_requests WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC LIMIT %d', self::MAX_REQUESTS_FOR_DELAY), $range);
        foreach ($rows as $row) {
            $steps = json_decode((string) $row['steps'], true);
            foreach (is_array($steps) ? $steps : [] as $step) {
                if (is_array($step) && ($step['status'] ?? null) !== ServiceRequest::SUBMITTED && is_string($step['at'] ?? null)) {
                    $delays[] = max(0, (new \DateTimeImmutable($step['at']))->getTimestamp() - (new \DateTimeImmutable((string) $row['created_at']))->getTimestamp()) / 3600;
                    break;
                }
            }
        }

        return new RequestReport(
            (int) ($counts['received'] ?? 0),
            (int) ($counts['resolved'] ?? 0),
            (int) ($counts['rejected'] ?? 0),
            (int) ($counts['waiting'] ?? 0),
            (int) ($counts['urgent'] ?? 0),
            $delays === [] ? null : round(array_sum($delays) / count($delays), 1),
            (int) $db->fetchOne("SELECT COUNT(*) FROM citizens WHERE status <> 'deleted' AND registered_at >= ? AND registered_at < ?", $range),
            (int) $db->fetchOne('SELECT COUNT(*) FROM citizen_appointments WHERE status <> ? AND created_at >= ? AND created_at < ?', [Appointment::CANCELLED, ...$range]),
            (int) $db->fetchOne('SELECT COUNT(*) FROM citizen_concerns WHERE created_at >= ? AND created_at < ?', $range),
        );
    }
}
