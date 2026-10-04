<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO;

/** Contract of `CurrentAgentProvider`: account identifier and display name (name, else e-mail). */
final readonly class AgentIdentity
{
    public function __construct(
        public string $id,
        public string $name,
    ) {}
}
