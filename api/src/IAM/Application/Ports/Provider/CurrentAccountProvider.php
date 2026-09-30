<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Provider;

interface CurrentAccountProvider
{
    public function userId(): string;
}
