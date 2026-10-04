<?php

declare(strict_types=1);

namespace Audit\Application\Service;

/** F85 : résultat d'une règle du détecteur, avant enregistrement. `protectAccountId` demande une réaction. */
final readonly class DetectedAnomaly
{
    /** @param list<array{type: string, id: string, label: string}> $related */
    public function __construct(
        public string $fingerprint,
        public string $rule,
        public string $category,
        public string $severity,
        public string $title,
        public string $explanation,
        public array $related = [],
        public ?string $protectAccountId = null,
        public int $lockSeconds = 0,
    ) {}
}
