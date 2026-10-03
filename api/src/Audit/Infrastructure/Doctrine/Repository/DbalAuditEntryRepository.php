<?php

declare(strict_types=1);

namespace Audit\Infrastructure\Doctrine\Repository;

use Audit\Application\Ports\Repository\AuditEntryRepository;
use Audit\Application\Query\ListAuditEntries\AuditFilters;
use Audit\Domain\Entity\AuditEntry;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Writes with DBAL rather than the unit of work: the insert joins the transaction opened by the command bus
 * (atomic with the action) and still works for infrastructure callers that never flush (login limiter).
 */
final readonly class DbalAuditEntryRepository implements AuditEntryRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function append(AuditEntry $entry): void
    {
        $this->db()->insert('audit_entries', [
            'id' => $entry->id,
            'occurred_at' => $entry->occurredAt->format('Y-m-d H:i:s'),
            'actor_id' => $entry->actorId,
            'actor_label' => $entry->actorLabel,
            'action' => $entry->action,
            'category' => $entry->category,
            'target_type' => $entry->targetType,
            'target_id' => $entry->targetId,
            'summary' => $entry->summary,
            'details' => json_encode($entry->details, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
        ]);
    }

    public function search(AuditFilters $filters, array $hiddenActionPrefixes, int $limit): array
    {
        [$where, $params, $types] = $this->visibility($hiddenActionPrefixes);
        if ($filters->actorId !== null) {
            $where[] = 'actor_id = :actor';
            $params['actor'] = $filters->actorId;
        }
        if ($filters->action !== null) {
            $where[] = 'action = :action';
            $params['action'] = $filters->action;
        }
        if ($filters->category !== null) {
            $where[] = 'category = :category';
            $params['category'] = $filters->category;
        }
        if ($filters->from !== null) {
            $where[] = 'occurred_at >= :from';
            $params['from'] = $filters->from->format('Y-m-d H:i:s');
        }
        if ($filters->to !== null) {
            $where[] = 'occurred_at < :to';
            $params['to'] = $filters->to->format('Y-m-d H:i:s');
        }
        if ($filters->search !== null) {
            $where[] = '(summary LIKE :q OR actor_label LIKE :q OR target_id LIKE :q OR target_type LIKE :q)';
            $params['q'] = '%' . addcslashes($filters->search, '%_\\') . '%';
        }
        $sql = 'SELECT id, occurred_at, actor_id, actor_label, action, category, target_type, target_id, summary, details FROM audit_entries'
            . ($where === [] ? '' : ' WHERE ' . implode(' AND ', $where))
            . sprintf(' ORDER BY occurred_at DESC, id DESC LIMIT %d', max(1, $limit));

        return array_map(static fn (array $row): array => [
            'id' => $row['id'],
            'occurredAt' => (new \DateTimeImmutable($row['occurred_at']))->format(\DateTimeInterface::ATOM),
            'actor' => ['id' => $row['actor_id'], 'label' => $row['actor_label']],
            'action' => $row['action'],
            'category' => $row['category'],
            'target' => ['type' => $row['target_type'], 'id' => $row['target_id']],
            'summary' => $row['summary'],
            'details' => json_decode((string) $row['details'], true) ?: [],
        ], $this->db()->fetchAllAssociative($sql, $params, $types));
    }

    public function facets(array $hiddenActionPrefixes): array
    {
        [$where, $params, $types] = $this->visibility($hiddenActionPrefixes);
        $clause = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);
        $actions = $this->db()->fetchFirstColumn('SELECT DISTINCT action FROM audit_entries' . $clause . ' ORDER BY action', $params, $types);
        $actors = $this->db()->fetchAllAssociative(
            'SELECT actor_id, MAX(actor_label) AS actor_label FROM audit_entries' . $clause
            . ' GROUP BY actor_id ORDER BY actor_label LIMIT 200',
            $params,
            $types,
        );

        return [
            'actions' => array_map('strval', $actions),
            'actors' => array_map(static fn (array $row): array => ['id' => $row['actor_id'], 'label' => (string) $row['actor_label']], $actors),
        ];
    }

    /**
     * @param list<string> $hiddenActionPrefixes
     * @return array{0: list<string>, 1: array<string, mixed>, 2: array<string, mixed>}
     */
    private function visibility(array $hiddenActionPrefixes): array
    {
        $where = [];
        $params = [];
        foreach (array_values($hiddenActionPrefixes) as $index => $prefix) {
            $where[] = sprintf('action NOT LIKE :hidden%d', $index);
            $params['hidden' . $index] = addcslashes($prefix, '%_\\') . '%';
        }

        return [$where, $params, []];
    }

    private function db(): Connection
    {
        return $this->manager->getConnection();
    }
}
