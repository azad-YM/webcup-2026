<?php

declare(strict_types=1);

namespace Tests\IAM\Doubles\Provider;

use IAM\Application\DTO\AccessibleSpace;
use IAM\Application\Ports\Provider\AccessibleSpacesProvider;

final class StubAccessibleSpacesProvider implements AccessibleSpacesProvider
{
    /** @param array<string, list<AccessibleSpace>> $spacesByUser */
    public function __construct(private array $spacesByUser = [], private bool $unavailable = false) {}

    public function findForUser(string $userId): array
    {
        if ($this->unavailable) {
            throw new \RuntimeException('Space provider unavailable');
        }
        return $this->spacesByUser[$userId] ?? [];
    }
}
