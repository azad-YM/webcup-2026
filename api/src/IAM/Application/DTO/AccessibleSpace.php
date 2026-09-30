<?php

declare(strict_types=1);

namespace IAM\Application\DTO;

final readonly class AccessibleSpace
{
    /** @param list<string> $roles Noms des rôles affectés dans cet espace. */
    public function __construct(
        public string $code,
        public string $name,
        public string $description,
        public array $roles,
    ) {}
}
