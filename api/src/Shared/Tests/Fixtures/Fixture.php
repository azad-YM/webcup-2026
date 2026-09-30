<?php

declare(strict_types=1);

namespace Tests\Shared\Fixtures;

use Psr\Container\ContainerInterface;

interface Fixture
{
    public function load(ContainerInterface $container): void;
}
