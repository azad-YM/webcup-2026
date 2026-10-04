<?php

declare(strict_types=1);

namespace Audit\Application\DTO\Security;

/** F85 : ce qu'IAM a réellement appliqué pour protéger un compte attaqué (phrase affichable à l'agent). */
final readonly class ProtectionResult
{
    public function __construct(
        public bool $applied,
        public int $lockedMinutes,
        public bool $codeRequired,
        public bool $holderWarned,
        public string $description,
    ) {}
}
