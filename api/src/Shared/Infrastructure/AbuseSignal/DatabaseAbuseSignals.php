<?php

declare(strict_types=1);

namespace Shared\Infrastructure\AbuseSignal;

use Doctrine\DBAL\Connection;
use Psr\Log\LoggerInterface;
use Shared\Application\Ports\Service\AbuseSignals;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F81, F85 : signaux d'abus en base (DBAL, hors transaction applicative : ils sont relevés avant le contrôleur).
 * Une panne d'écriture est journalisée et ignorée : relever un signal ne doit jamais bloquer une requête.
 * Purge opportuniste des signaux de plus de 30 jours.
 */
final readonly class DatabaseAbuseSignals implements AbuseSignals
{
    private const RETENTION_DAYS = 30;

    public function __construct(
        private Connection $connection,
        #[Autowire('%kernel.secret%')] private string $secret,
        private ?LoggerInterface $logger = null,
    ) {}

    public function record(string $kind, string $rule, string $client): void
    {
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        try {
            $this->connection->insert('abuse_signals', [
                'kind' => mb_substr($kind, 0, 30),
                'rule' => mb_substr($rule, 0, 60),
                'client' => substr(hash_hmac('sha256', $client, $this->secret), 0, 16),
                'occurred_at' => $now->format('Y-m-d H:i:s'),
            ]);
            if (random_int(1, 200) === 1) {
                $this->connection->executeStatement('DELETE FROM abuse_signals WHERE occurred_at < ? LIMIT 1000', [
                    $now->modify(sprintf('-%d days', self::RETENTION_DAYS))->format('Y-m-d H:i:s'),
                ]);
            }
        } catch (\Throwable $exception) {
            $this->logger?->warning('Abuse signal not recorded.', ['kind' => $kind, 'exception' => $exception::class]);
        }
    }

    public function countsSince(\DateTimeImmutable $since): array
    {
        try {
            $rows = $this->connection->fetchAllKeyValue(
                'SELECT kind, COUNT(*) FROM abuse_signals WHERE occurred_at >= ? GROUP BY kind',
                [self::utc($since)],
            );
        } catch (\Throwable) {
            return [];
        }

        return array_map('intval', $rows);
    }

    public function burstsSince(\DateTimeImmutable $since, int $threshold): array
    {
        try {
            $rows = $this->connection->fetchAllAssociative(
                'SELECT kind, rule, client, COUNT(*) AS hits FROM abuse_signals WHERE occurred_at >= ?
                 GROUP BY kind, rule, client HAVING COUNT(*) >= ? ORDER BY hits DESC LIMIT 50',
                [self::utc($since), max(1, $threshold)],
            );
        } catch (\Throwable) {
            return [];
        }

        return array_map(static fn (array $row): array => [
            'kind' => (string) $row['kind'],
            'rule' => (string) $row['rule'],
            'client' => (string) $row['client'],
            'count' => (int) $row['hits'],
        ], $rows);
    }

    private static function utc(\DateTimeImmutable $at): string
    {
        return $at->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }
}
