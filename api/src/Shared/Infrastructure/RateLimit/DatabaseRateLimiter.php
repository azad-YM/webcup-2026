<?php

declare(strict_types=1);

namespace Shared\Infrastructure\RateLimit;

use Doctrine\DBAL\Connection;
use Psr\Log\LoggerInterface;

/**
 * F69 (ADR 007) : limiteur de débit en base, à fenêtre fixe, sans dépendance supplémentaire
 * (`symfony/rate-limiter` n'est pas installé). Un `INSERT … ON DUPLICATE KEY UPDATE` atomique incrémente le
 * compteur de la fenêtre courante ; les compteurs expirés sont purgés de temps en temps.
 * En cas de panne de la base, la requête passe (journalisée) : la limitation ne doit pas bloquer l'usage normal.
 */
final readonly class DatabaseRateLimiter
{
    public function __construct(private Connection $connection, private ?LoggerInterface $logger = null) {}

    /** @return int|null secondes avant de pouvoir réessayer si la limite est dépassée, sinon null */
    public function consume(string $rule, string $client, int $limit, int $windowSeconds, ?\DateTimeImmutable $now = null): ?int
    {
        $now ??= new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $windowStart = intdiv($now->getTimestamp(), $windowSeconds) * $windowSeconds;
        $expiresAt = (new \DateTimeImmutable('@' . ($windowStart + $windowSeconds)))->setTimezone(new \DateTimeZone('UTC'));
        $id = hash('sha256', $rule . '|' . $client . '|' . $windowStart);
        try {
            $this->connection->executeStatement(
                'INSERT INTO rate_limit_counter (id, rule, hits, expires_at) VALUES (?, ?, 1, ?) ON DUPLICATE KEY UPDATE hits = hits + 1',
                [$id, mb_substr($rule, 0, 60), $expiresAt->format('Y-m-d H:i:s')],
            );
            $hits = (int) $this->connection->fetchOne('SELECT hits FROM rate_limit_counter WHERE id = ?', [$id]);
            if (random_int(1, 100) === 1) {
                $this->connection->executeStatement('DELETE FROM rate_limit_counter WHERE expires_at < ?', [$now->format('Y-m-d H:i:s')]);
            }
        } catch (\Throwable $exception) {
            $this->logger?->warning('Rate limiter unavailable: request allowed.', ['rule' => $rule, 'exception' => $exception::class]);

            return null;
        }

        return $hits > $limit ? max(1, $expiresAt->getTimestamp() - $now->getTimestamp()) : null;
    }
}
