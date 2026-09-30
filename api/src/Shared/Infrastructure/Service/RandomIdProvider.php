<?php

namespace Shared\Infrastructure\Service;

use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Uid\Uuid;

class RandomIdProvider implements IIdProvider
{
    public function getId(): string
    {
        return Uuid::v7()->toString();
    }
}
