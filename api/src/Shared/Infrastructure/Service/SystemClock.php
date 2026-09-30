<?php

namespace Shared\Infrastructure\Service;

use Shared\Application\Ports\Service\IClock;

final class SystemClock implements IClock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }
}
