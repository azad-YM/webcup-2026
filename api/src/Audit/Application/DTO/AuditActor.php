<?php

declare(strict_types=1);

namespace Audit\Application\DTO;

/** Contract of `AuditActorProvider`: account identifier and the label shown in the journal (name, else e-mail). */
final readonly class AuditActor
{
    public function __construct(
        public string $id,
        public string $label,
    ) {}
}
