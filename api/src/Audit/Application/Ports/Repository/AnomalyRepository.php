<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Repository;

use Audit\Domain\Entity\Anomaly;

/** F85 : anomalies détectées (table `audit_anomalies`). Sans `flush` propre : le `command.bus` valide. */
interface AnomalyRepository
{
    public function save(Anomaly $anomaly): void;

    public function find(string $id): ?Anomaly;

    public function findByFingerprint(string $fingerprint): ?Anomaly;

    /** @return list<Anomaly> les plus récentes d'abord */
    public function search(?string $status, ?string $severity, int $limit): array;

    /** @return list<Anomaly> anomalies vues depuis `$since` (résumé du jour) */
    public function seenSince(\DateTimeImmutable $since): array;

    /** @return array{new: int, seen: int, handled: int, criticalOpen: int} */
    public function counters(): array;
}
