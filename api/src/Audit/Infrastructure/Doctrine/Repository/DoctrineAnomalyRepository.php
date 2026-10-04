<?php

declare(strict_types=1);

namespace Audit\Infrastructure\Doctrine\Repository;

use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Domain\Entity\Anomaly;
use Doctrine\ORM\EntityManagerInterface;

/** F85 : persistance des anomalies ; le `flush` appartient au middleware de transaction du `command.bus`. */
final readonly class DoctrineAnomalyRepository implements AnomalyRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(Anomaly $anomaly): void
    {
        $this->manager->persist($anomaly);
    }

    public function find(string $id): ?Anomaly
    {
        return $this->manager->find(Anomaly::class, $id);
    }

    public function findByFingerprint(string $fingerprint): ?Anomaly
    {
        return $this->manager->getRepository(Anomaly::class)->findOneBy(['fingerprint' => $fingerprint]);
    }

    public function search(?string $status, ?string $severity, int $limit): array
    {
        $criteria = [];
        if ($status !== null) {
            $criteria['status'] = $status;
        }
        if ($severity !== null) {
            $criteria['severity'] = $severity;
        }

        return array_values($this->manager->getRepository(Anomaly::class)->findBy($criteria, ['lastSeenAt' => 'DESC'], max(1, $limit)));
    }

    public function seenSince(\DateTimeImmutable $since): array
    {
        return array_values($this->manager->createQueryBuilder()
            ->select('a')->from(Anomaly::class, 'a')
            ->where('a.lastSeenAt >= :since')->setParameter('since', $since)
            ->orderBy('a.lastSeenAt', 'DESC')->setMaxResults(100)
            ->getQuery()->getResult());
    }

    public function counters(): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            "SELECT status, SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical, COUNT(*) AS total FROM audit_anomalies GROUP BY status",
        );
        $counters = ['new' => 0, 'seen' => 0, 'handled' => 0, 'criticalOpen' => 0];
        foreach ($rows as $row) {
            $counters[(string) $row['status']] = (int) $row['total'];
            if ($row['status'] !== Anomaly::HANDLED) {
                $counters['criticalOpen'] += (int) $row['critical'];
            }
        }

        return $counters;
    }
}
