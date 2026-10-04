<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\LoginSecurityEventRepository;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use IAM\Domain\Entity\LoginSecurityEvent;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;

/**
 * MySQL counters shared by every PHP worker and kept across restarts.
 *
 * Only failures count. Reaching the threshold of a scope inside its window locks that scope
 * for `base * 2^previousLockouts` seconds (capped at one hour); lockouts are remembered 24 h,
 * which makes the lock progressive for repeated offenders. Each lock writes a journal entry.
 */
final readonly class DoctrineLoginAttemptLimiter implements LoginAttemptLimiter
{
    /** scope => [failures before lock, base lock seconds] */
    public const RULES = [
        'pair' => [5, 60],      // one account from one IP: 1, 2, 4, 8… minutes
        'account' => [10, 300], // one account from any IP (distributed guessing): 5, 10, 20… minutes
        'ip' => [30, 300],      // one IP across many accounts (credential stuffing): 5, 10, 20… minutes
    ];
    public const WINDOW = 900;
    public const MAX_LOCK = 3600;
    public const MEMORY = 86400;

    public function __construct(
        private EntityManagerInterface $manager,
        private IClock $clock,
        private IIdProvider $ids,
        private LoginSecurityEventRepository $journal,
        private ?AuditTrail $audit = null,
    ) {}

    public function retryAfter(string $email, string $ip): int
    {
        $now = $this->now();
        $ids = array_values($this->keys($email, $ip));
        $locked = $this->db()->fetchOne(
            'SELECT MAX(locked_until) FROM iam_login_attempt_buckets WHERE id IN (?, ?, ?) AND locked_until > ?',
            [...$ids, $now],
        );
        return $locked ? max(0, (int) $locked - $now) : 0;
    }

    public function recordFailure(string $email, string $ip): int
    {
        $now = $this->now();
        $email = $this->normalize($email);
        $lock = 0;
        $events = [];
        $this->db()->transactional(function (Connection $db) use ($email, $ip, $now, &$lock, &$events): void {
            foreach ($this->keys($email, $ip) as $scope => $id) {
                if ($scope !== 'ip' && $email === '') continue;
                [$threshold, $base] = self::RULES[$scope];
                $row = $db->fetchAssociative('SELECT * FROM iam_login_attempt_buckets WHERE id = ? FOR UPDATE', [$id]);
                $lockouts = $row !== false && (int) $row['expires_at'] > $now ? (int) $row['lockouts'] : 0;
                $failures = $row !== false && (int) $row['window_until'] > $now ? (int) $row['failures'] + 1 : 1;
                $windowUntil = $failures === 1 ? $now + self::WINDOW : (int) $row['window_until'];
                $lockedUntil = $row !== false ? (int) $row['locked_until'] : 0;
                if ($failures >= $threshold) {
                    $duration = min(self::MAX_LOCK, $base * (2 ** min($lockouts, 10)));
                    $lockedUntil = $now + $duration;
                    $events[] = [$scope, $failures, $duration];
                    $lock = max($lock, $duration);
                    ++$lockouts;
                    $failures = 0;
                }
                $expiresAt = max($windowUntil, $lockedUntil) + ($lockouts > 0 ? self::MEMORY : 0);
                $db->executeStatement(
                    'INSERT INTO iam_login_attempt_buckets (id, failures, window_until, locked_until, lockouts, expires_at) VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE failures = VALUES(failures), window_until = VALUES(window_until), locked_until = VALUES(locked_until), lockouts = VALUES(lockouts), expires_at = VALUES(expires_at)',
                    [$id, $failures, $windowUntil, $lockedUntil, $lockouts, $expiresAt],
                );
            }
            // Bounded incremental cleanup.
            $db->executeStatement('DELETE FROM iam_login_attempt_buckets WHERE expires_at <= ? LIMIT 100', [$now]);
        });
        foreach ($events as [$scope, $failures, $duration]) {
            $this->journal->record(new LoginSecurityEvent(
                $this->ids->getId(),
                $this->clock->now(),
                $scope,
                $scope === 'ip' ? null : mb_substr($email, 0, 180),
                mb_substr($ip, 0, 45),
                $failures,
                $duration,
            ));
            $target = $scope === 'ip' ? mb_substr($ip, 0, 45) : mb_substr($email, 0, 120);
            $this->audit?->record(
                'iam.login.blocked',
                'login',
                $target,
                sprintf('Connexion bloquée %d min après %d échecs (%s).', (int) ceil($duration / 60), $failures, $scope),
                ['scope' => $scope, 'ip' => mb_substr($ip, 0, 45), 'failures' => $failures, 'lockedSeconds' => $duration],
                sprintf('Anonyme (%s)', $target),
            );
        }
        return $lock;
    }

    public function lockAccount(string $email, int $seconds): void
    {
        if ($seconds <= 0) {
            return;
        }
        $now = $this->now();
        $id = $this->keys($email, '')['account'];
        $until = $now + min(self::MAX_LOCK, $seconds);
        $this->db()->executeStatement(
            'INSERT INTO iam_login_attempt_buckets (id, failures, window_until, locked_until, lockouts, expires_at) VALUES (?, 0, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE locked_until = GREATEST(locked_until, VALUES(locked_until)), lockouts = lockouts + 1, expires_at = GREATEST(expires_at, VALUES(expires_at))',
            [$id, $now, $until, $until + self::MEMORY],
        );
    }

    public function recordSuccess(string $email, string $ip): void
    {
        $keys = $this->keys($email, $ip);
        $this->db()->executeStatement(
            'UPDATE iam_login_attempt_buckets SET failures = 0 WHERE id IN (?, ?)',
            [$keys['pair'], $keys['account']],
        );
    }

    /** @return array{pair: string, account: string, ip: string} */
    private function keys(string $email, string $ip): array
    {
        $email = $this->normalize($email);
        return [
            'pair' => hash('sha256', 'pair:'.$ip.'|'.$email),
            'account' => hash('sha256', 'account:'.$email),
            'ip' => hash('sha256', 'ip:'.$ip),
        ];
    }

    private function normalize(string $email): string { return mb_strtolower(trim($email)); }
    private function now(): int { return $this->clock->now()->getTimestamp(); }
    private function db(): Connection { return $this->manager->getConnection(); }
}
