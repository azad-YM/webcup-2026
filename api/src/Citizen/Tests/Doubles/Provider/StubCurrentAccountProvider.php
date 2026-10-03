<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Provider;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;

final class StubCurrentAccountProvider implements CurrentAccountProvider
{
    public function __construct(public string $id = 'account-id') {}
    public function userId(): string { return $this->id; }
}
