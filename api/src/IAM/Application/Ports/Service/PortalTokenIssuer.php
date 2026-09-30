<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;
interface PortalTokenIssuer
{
    /** @return array{hash: string, expiresAt: int} */
    public function currentSession(): array;
    public function issue(string $userId, string $email, string $destination, int $expiresAt): string;
}
