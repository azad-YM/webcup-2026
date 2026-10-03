<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\LoginSecurityEvent;

interface LoginSecurityEventRepository
{
    /** Persists immediately: the login firewall runs outside the command bus transaction. */
    public function record(LoginSecurityEvent $event): void;

    /** @return list<LoginSecurityEvent> most recent first */
    public function latest(int $limit, ?string $search = null): array;
}
