<?php

namespace Shared\Application\Ports\Service;

interface IClock
{
    public function now(): \DateTimeImmutable;
}
