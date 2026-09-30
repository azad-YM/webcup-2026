<?php

declare(strict_types=1);

namespace Tests\IAM\Doubles\Provider;

use IAM\Application\Ports\Provider\CurrentAccountProvider;

final readonly class StubCurrentAccountProvider implements CurrentAccountProvider
{
    public function __construct(private string $id = 'actor-id') {}
    public function userId(): string { return $this->id; }
}
