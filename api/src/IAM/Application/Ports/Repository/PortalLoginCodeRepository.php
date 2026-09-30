<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;
use IAM\Domain\Entity\PortalLoginCode;
interface PortalLoginCodeRepository
{
    public function save(PortalLoginCode $code): void;
    public function consume(string $hash, string $destination, string $challenge, int $now): ?PortalLoginCode;
}
