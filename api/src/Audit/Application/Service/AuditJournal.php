<?php

declare(strict_types=1);

namespace Audit\Application\Service;

use Audit\Application\Ports\Provider\AuditActorProvider;
use Audit\Application\Ports\Repository\AuditEntryRepository;
use Audit\Domain\Entity\AuditEntry;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;

/** Use case "record an action": resolves the actor and the time, then appends the entry. */
final readonly class AuditJournal
{
    public function __construct(
        private AuditEntryRepository $entries,
        private AuditActorProvider $actors,
        private IClock $clock,
        private IIdProvider $ids,
    ) {}

    /** @param array<string, mixed> $details */
    public function record(string $action, string $targetType, ?string $targetId, string $summary, array $details = [], ?string $actorLabel = null): void
    {
        $actor = $actorLabel === null ? $this->actors->current() : null;
        $this->entries->append(AuditEntry::record(
            $this->ids->getId(),
            $this->clock->now(),
            $actor?->id,
            $actorLabel ?? $actor?->label ?? 'Système',
            $action,
            $targetType,
            $targetId,
            $summary,
            $details,
        ));
    }
}
