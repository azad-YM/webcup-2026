<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

interface PortalCodeGenerator
{
    public function generate(): string;
}
