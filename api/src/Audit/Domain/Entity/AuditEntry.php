<?php

declare(strict_types=1);

namespace Audit\Domain\Entity;

/**
 * One line of the administration action journal: who did what, when, on what. Immutable once recorded.
 */
class AuditEntry
{
    public const ACTION_PATTERN = '/^[a-z]+(\.[a-z_-]+){2,}$/';

    /** @param array<string, mixed> $details */
    private function __construct(
        public readonly string $id,
        public readonly \DateTimeImmutable $occurredAt,
        public readonly ?string $actorId,
        public readonly string $actorLabel,
        public readonly string $action,
        public readonly string $category,
        public readonly string $targetType,
        public readonly ?string $targetId,
        public readonly string $summary,
        public readonly array $details,
    ) {}

    /** @param array<string, mixed> $details */
    public static function record(
        string $id,
        \DateTimeImmutable $occurredAt,
        ?string $actorId,
        string $actorLabel,
        string $action,
        string $targetType,
        ?string $targetId,
        string $summary,
        array $details = [],
    ): self {
        if (!preg_match(self::ACTION_PATTERN, $action) || strlen($action) > 80) {
            throw new \InvalidArgumentException(sprintf('Malformed audit action "%s".', $action));
        }
        $actorLabel = trim($actorLabel) === '' ? 'Inconnu' : trim($actorLabel);

        return new self(
            $id,
            $occurredAt,
            $actorId,
            mb_substr($actorLabel, 0, 180),
            $action,
            explode('.', $action)[0],
            mb_substr($targetType, 0, 40),
            $targetId === null ? null : mb_substr($targetId, 0, 120),
            mb_substr(trim($summary), 0, 255),
            $details,
        );
    }
}
