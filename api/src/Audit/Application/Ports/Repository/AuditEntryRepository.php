<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Repository;

use Audit\Application\Query\ListAuditEntries\AuditFilters;
use Audit\Domain\Entity\AuditEntry;

interface AuditEntryRepository
{
    /** Appends the entry inside the current transaction when there is one (command bus), immediately otherwise. */
    public function append(AuditEntry $entry): void;

    /**
     * Most recent first, at most `$limit` lines.
     *
     * @param list<string> $hiddenActionPrefixes action prefixes the reader may not see (e.g. `iam.login.`)
     * @return list<array<string, mixed>>
     */
    public function search(AuditFilters $filters, array $hiddenActionPrefixes, int $limit): array;

    /**
     * Distinct actions and actors of the visible journal, to build the filters.
     *
     * @param list<string> $hiddenActionPrefixes
     * @return array{actions: list<string>, actors: list<array{id: string|null, label: string}>}
     */
    public function facets(array $hiddenActionPrefixes): array;

    /**
     * F85 : nombre d'actions par acteur depuis `$since` (hors préfixes exclus), au-delà de `$threshold`.
     *
     * @param list<string> $excludedActionPrefixes
     * @return list<array{actorId: ?string, actorLabel: string, count: int, actions: int}>
     */
    public function actorBursts(\DateTimeImmutable $since, array $excludedActionPrefixes, int $threshold): array;

    /**
     * F85 : nombre d'entrées d'une action donnée par acteur depuis `$since`, avec la somme du détail `$countDetail`
     * (ex. nombre de fiches affichées), au-delà de `$threshold` entrées.
     *
     * @return list<array{actorId: ?string, actorLabel: string, count: int, total: int}>
     */
    public function actionBursts(string $action, \DateTimeImmutable $since, int $threshold, ?string $countDetail = null): array;
}
