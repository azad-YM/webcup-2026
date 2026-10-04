<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Report\ParticipationReport;
use Pilotage\Application\DTO\Report\ServiceSatisfaction;
use Pilotage\Application\Ports\Provider\Report\ParticipationReportProvider;

/** F98, F103 : port du Pilotage implémenté par Participation, comptes sur ses propres tables uniquement. */
final readonly class ParticipationPilotageReport implements ParticipationReportProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function serviceSatisfaction(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            "SELECT service_id, COUNT(*) AS reviews, AVG(rating) AS rating, AVG(need_met = 'yes') AS met FROM participation_service_reviews WHERE created_at >= ? AND created_at < ? GROUP BY service_id",
            [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')],
        );

        return array_map(static fn (array $row): ServiceSatisfaction => new ServiceSatisfaction(
            (string) $row['service_id'],
            (int) $row['reviews'],
            $row['rating'] === null ? null : round((float) $row['rating'], 1),
            $row['met'] === null ? null : round((float) $row['met'], 2),
        ), $rows);
    }

    public function participationReport(\DateTimeImmutable $from, \DateTimeImmutable $to): ParticipationReport
    {
        $db = $this->manager->getConnection();
        $range = [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')];
        $reviews = $db->fetchAssociative('SELECT COUNT(*) AS total, AVG(rating) AS rating FROM participation_service_reviews WHERE created_at >= ? AND created_at < ?', $range) ?: [];

        return new ParticipationReport(
            (int) $db->fetchOne('SELECT COUNT(*) FROM participation_contributions WHERE submitted_at >= ? AND submitted_at < ?', $range),
            (int) $db->fetchOne('SELECT COUNT(*) FROM participation_ideas WHERE created_at >= ? AND created_at < ?', $range),
            (int) ($reviews['total'] ?? 0),
            ($reviews['rating'] ?? null) === null ? null : round((float) $reviews['rating'], 1),
        );
    }
}
