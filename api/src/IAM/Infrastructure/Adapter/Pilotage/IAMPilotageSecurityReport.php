<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Report\SecurityReport;
use Pilotage\Application\Ports\Provider\Report\SecurityReportProvider;

/** F103 : port du Pilotage implémenté par IAM, comptes sur ses propres tables uniquement (jamais d'e-mail ni d'adresse). */
final readonly class IAMPilotageSecurityReport implements SecurityReportProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function securityReport(\DateTimeImmutable $from, \DateTimeImmutable $to): SecurityReport
    {
        $db = $this->manager->getConnection();

        return new SecurityReport(
            (int) $db->fetchOne('SELECT COUNT(*) FROM iam_login_security_events WHERE occurred_at >= ? AND occurred_at < ?', [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')]),
            (int) $db->fetchOne("SELECT COUNT(*) FROM auth_users WHERE status = 'suspended'"),
        );
    }
}
