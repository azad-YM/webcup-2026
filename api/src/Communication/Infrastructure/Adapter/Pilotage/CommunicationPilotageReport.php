<?php

declare(strict_types=1);

namespace Communication\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Report\CommunicationReport;
use Pilotage\Application\Ports\Provider\Report\CommunicationReportProvider;

/** F103 : port du Pilotage implémenté par Communication, comptes sur ses propres tables uniquement. */
final readonly class CommunicationPilotageReport implements CommunicationReportProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function communicationReport(\DateTimeImmutable $from, \DateTimeImmutable $to): CommunicationReport
    {
        $db = $this->manager->getConnection();
        $range = [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')];
        $alerts = $db->fetchAssociative(
            "SELECT SUM(category <> 'official') AS alerts, SUM(category <> 'official' AND severity = 'critical') AS critical, SUM(category = 'official') AS official"
            .' FROM communication_alert WHERE published_at IS NOT NULL AND published_at >= ? AND published_at < ?',
            $range,
        ) ?: [];

        return new CommunicationReport(
            (int) ($alerts['alerts'] ?? 0),
            (int) ($alerts['critical'] ?? 0),
            (int) $db->fetchOne('SELECT COUNT(*) FROM communication_publication WHERE published_at IS NOT NULL AND published_at >= ? AND published_at < ?', $range),
            (int) ($alerts['official'] ?? 0),
        );
    }
}
