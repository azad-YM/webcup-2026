<?php

declare(strict_types=1);

namespace Tests\Example\Doubles\Provider;

use Example\Application\Ports\Provider\ItemAccessPolicy;
use Shared\Domain\Exception\AccessDeniedException;

final class StubItemAccessPolicy implements ItemAccessPolicy
{
    public bool $readAllowed = true;
    public bool $writeAllowed = true;

    public function assertCanRead(): void
    {
        if (!$this->readAllowed) {
            throw new AccessDeniedException('Item read access denied.');
        }
    }

    public function assertCanWrite(): void
    {
        if (!$this->writeAllowed) {
            throw new AccessDeniedException('Item write access denied.');
        }
    }
}
