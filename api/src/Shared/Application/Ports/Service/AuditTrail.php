<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Service;

/**
 * Records "who did what, when, on what" for the administration action journal (L12, ADR 006).
 *
 * Called by the use case of the BC that owns the action, once its rules have accepted the mutation and
 * before the transaction of the command bus commits: the entry is written in the same transaction, so a
 * refused or rolled back action leaves no trace and an accepted one cannot lose its trace.
 * The actor is the connected account unless `$actorLabel` names another source (e.g. an anonymous login attempt).
 * The implementation lives in the infrastructure of the Audit BC; Shared knows no BC.
 */
interface AuditTrail
{
    public const ACTION_PATTERN = '/^[a-z]+(\.[a-z_-]+){2,}$/';

    /**
     * @param string                $action     `<bc>.<resource>.<verb>`, e.g. `administration.role.created`
     * @param string                $targetType resource touched, e.g. `role`, `alert`, `citizen-account`
     * @param string|null           $targetId   identifier of the resource (never a secret)
     * @param string                $summary    one French sentence readable by an agent
     * @param array<string, mixed>  $details    small JSON-encodable context, without secrets
     * @param string|null           $actorLabel overrides the connected account (anonymous or system actions)
     *
     * @throws \InvalidArgumentException when the action code is malformed (programming error)
     */
    public function record(string $action, string $targetType, ?string $targetId, string $summary, array $details = [], ?string $actorLabel = null): void;
}
