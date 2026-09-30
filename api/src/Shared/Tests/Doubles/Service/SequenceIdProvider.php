<?php

namespace Tests\Shared\Doubles\Service;

use Shared\Application\Ports\Service\IIdProvider;

final class SequenceIdProvider implements IIdProvider
{
    /** @param list<string> $ids */
    public function __construct(private array $ids) {}

    public function getId(): string
    {
        return array_shift($this->ids) ?? throw new \LogicException('No test identifier remaining');
    }
}
