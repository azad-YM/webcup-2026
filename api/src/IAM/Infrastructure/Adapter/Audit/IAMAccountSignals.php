<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Audit;

use Audit\Application\DTO\Security\AccountSignal;
use Audit\Application\DTO\Security\BlockedLoginSignal;
use Audit\Application\Ports\Provider\AccountSignalsProvider;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Service\IdentityReconfirmation;

/**
 * Port d'Audit (F85) implémenté par IAM : lectures de ses seules tables, libellés masqués
 * (`j•••@domaine`, adresse IP tronquée), aucun secret ni empreinte d'appareil exposés.
 */
final readonly class IAMAccountSignals implements AccountSignalsProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function blockedLoginsSince(\DateTimeImmutable $since): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            "SELECT CASE WHEN e.scope = 'ip' THEN 'ip' ELSE 'account' END AS kind,
                    CASE WHEN e.scope = 'ip' THEN e.ip ELSE e.email END AS target,
                    COUNT(*) AS lockouts, SUM(e.failures) AS failures, MAX(u.id) AS account_id
             FROM iam_login_security_events e
             LEFT JOIN auth_users u ON e.scope <> 'ip' AND u.email = e.email
             WHERE e.occurred_at >= ?
             GROUP BY kind, target ORDER BY lockouts DESC LIMIT 50",
            [$since->format('Y-m-d H:i:s')],
        );

        return array_map(static fn (array $row): BlockedLoginSignal => new BlockedLoginSignal(
            (string) $row['kind'],
            substr(hash('sha256', $row['kind'].'|'.$row['target']), 0, 16),
            $row['kind'] === 'ip' ? self::maskIp((string) $row['target']) : IdentityReconfirmation::maskEmail((string) $row['target']),
            $row['account_id'] !== null ? (string) $row['account_id'] : null,
            (int) $row['lockouts'],
            (int) $row['failures'],
        ), $rows);
    }

    public function newDevicesSince(\DateTimeImmutable $since, int $minimum): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            'SELECT d.user_id, u.email, COUNT(*) AS devices FROM iam_known_devices d JOIN auth_users u ON u.id = d.user_id
             WHERE d.first_seen_at >= ? AND d.first_seen_at > (SELECT MIN(d2.first_seen_at) FROM iam_known_devices d2 WHERE d2.user_id = d.user_id)
             GROUP BY d.user_id, u.email HAVING COUNT(*) >= ? ORDER BY devices DESC LIMIT 50',
            [$since->format('Y-m-d H:i:s'), max(1, $minimum)],
        );

        return array_map(fn (array $row): AccountSignal => new AccountSignal((string) $row['user_id'], $this->label((string) $row['email']), (int) $row['devices']), $rows);
    }

    public function inactiveAccountsSignedInSince(\DateTimeImmutable $since): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            "SELECT s.user_id, u.email, COUNT(*) AS sign_ins FROM iam_sign_ins s JOIN auth_users u ON u.id = s.user_id
             WHERE s.occurred_at >= ? AND u.status <> 'active' GROUP BY s.user_id, u.email LIMIT 50",
            [$since->format('Y-m-d H:i:s')],
        );

        return array_map(fn (array $row): AccountSignal => new AccountSignal((string) $row['user_id'], $this->label((string) $row['email']), (int) $row['sign_ins']), $rows);
    }

    public function activeAmong(array $accountIds): array
    {
        $ids = array_values(array_slice(array_filter($accountIds, 'is_string'), 0, 500));
        if ($ids === []) {
            return [];
        }
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            sprintf("SELECT id, email FROM auth_users WHERE status = 'active' AND id IN (%s)", implode(', ', array_fill(0, count($ids), '?'))),
            $ids,
        );

        return array_map(fn (array $row): AccountSignal => new AccountSignal((string) $row['id'], $this->label((string) $row['email']), 0), $rows);
    }

    private function label(string $email): string
    {
        return str_ends_with($email, '.invalid') ? 'Compte sans e-mail' : IdentityReconfirmation::maskEmail($email);
    }

    private static function maskIp(string $ip): string
    {
        if (str_contains($ip, ':')) {
            return implode(':', array_slice(explode(':', $ip), 0, 3)).':…';
        }
        $parts = explode('.', $ip);

        return count($parts) === 4 ? sprintf('%s.%s.%s.x', $parts[0], $parts[1], $parts[2]) : 'adresse inconnue';
    }
}
