<?php

declare(strict_types=1);

namespace Audit\Infrastructure\Adapter\Shared;

use Audit\Application\Service\AuditJournal;
use Shared\Application\Ports\Service\AuditTrail;

/** Shared port `AuditTrail` implemented by the Audit BC: translates the call to its own use case. */
final readonly class AuditTrailRecorder implements AuditTrail
{
    public function __construct(private AuditJournal $journal) {}

    public function record(string $action, string $targetType, ?string $targetId, string $summary, array $details = [], ?string $actorLabel = null): void
    {
        $this->journal->record($action, $targetType, $targetId, $summary, $details, $actorLabel);
    }
}
