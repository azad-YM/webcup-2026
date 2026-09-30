<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Application\Ports\Service\PortalCodeGenerator;

final class SecurePortalCodeGenerator implements PortalCodeGenerator
{
    public function generate(): string
    {
        return bin2hex(random_bytes(32));
    }
}
