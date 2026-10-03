<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Provider;

interface CurrentAccountProvider
{
    public function userId(): string;
}
