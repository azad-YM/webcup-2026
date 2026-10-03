<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

/** Shared buffer of realtime events (`realtime_event`): written by the publisher, read by the SSE stream. */
final readonly class RealtimeEventRepository
{
    public const PUBLIC_PREFIX = 'public.';
    private const BATCH = 100;

    public function __construct(private Connection $connection) {}

    public function append(string $topic, string $type, string $payload, \DateTimeImmutable $createdAt): void
    {
        $this->connection->insert('realtime_event', [
            'topic' => $topic,
            'type' => $type,
            'payload' => $payload,
            'created_at' => $createdAt->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Events after the cursor on the public topics and on the given private topics, oldest first.
     *
     * @param list<string> $privateTopics
     * @return list<array{id: int, topic: string, type: string, payload: string}>
     */
    public function findAfter(int $lastEventId, array $privateTopics): array
    {
        $query = $this->connection->createQueryBuilder()
            ->select('id', 'topic', 'type', 'payload')
            ->from('realtime_event')
            ->where('id > :last')
            ->setParameter('last', $lastEventId)
            ->orderBy('id', 'ASC')
            ->setMaxResults(self::BATCH);
        $visible = 'topic LIKE :public';
        $query->setParameter('public', self::PUBLIC_PREFIX . '%');
        if ($privateTopics !== []) {
            $visible = '(' . $visible . ' OR topic IN (:topics))';
            $query->setParameter('topics', array_values(array_unique($privateTopics)), ArrayParameterType::STRING);
        }
        $query->andWhere($visible);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'topic' => (string) $row['topic'],
            'type' => (string) $row['type'],
            'payload' => (string) $row['payload'],
        ], $query->executeQuery()->fetchAllAssociative());
    }

    /** Identifier of the latest event, so that a new connection only receives what happens next. */
    public function lastId(): int
    {
        return (int) $this->connection->fetchOne('SELECT COALESCE(MAX(id), 0) FROM realtime_event');
    }

    public function purgeOlderThan(\DateTimeImmutable $limit): int
    {
        return (int) $this->connection->executeStatement('DELETE FROM realtime_event WHERE created_at < :limit', ['limit' => $limit->format('Y-m-d H:i:s')]);
    }
}
