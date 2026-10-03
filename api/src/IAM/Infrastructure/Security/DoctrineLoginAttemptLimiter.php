<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use Shared\Application\Ports\Service\IClock;

/** Atomic MySQL counters shared by PHP workers and persisted across restarts. */
final readonly class DoctrineLoginAttemptLimiter implements LoginAttemptLimiter
{
    public function __construct(private EntityManagerInterface $manager, private IClock $clock) {}
    public function consume(string $email, string $ip): int
    {
        $db = $this->manager->getConnection();
        $now = $this->clock->now()->getTimestamp();
        $email = strtolower(trim($email));
        $retry = 0;
        // All attempts count, including successful ones; no account existence signal.
        foreach ([['ip:'.$ip, 50], ['pair:'.$ip.'|'.$email, 5], ['account:'.$email, 20]] as [$key, $limit]) {
            $id = hash('sha256', $key);
            $db->executeStatement('INSERT INTO iam_login_attempt_buckets (id, attempts, expires_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE attempts = IF(expires_at <= ?, 1, attempts + 1), expires_at = IF(expires_at <= ?, ?, expires_at)', [$id, $now + 900, $now, $now, $now + 900]);
            $bucket = $db->fetchAssociative('SELECT attempts, expires_at FROM iam_login_attempt_buckets WHERE id = ?', [$id]);
            if ((int) $bucket['attempts'] > $limit) $retry = max($retry, (int) $bucket['expires_at'] - $now);
        }
        // Bounded incremental cleanup, including on rejected requests.
        $db->executeStatement('DELETE FROM iam_login_attempt_buckets WHERE expires_at <= ? LIMIT 100', [$now]);
        return $retry;
    }
}
