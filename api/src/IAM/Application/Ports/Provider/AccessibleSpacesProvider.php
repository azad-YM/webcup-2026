<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Provider;

use IAM\Application\DTO\AccessibleSpace;

interface AccessibleSpacesProvider
{
    /** @return list<AccessibleSpace> */
    public function findForUser(string $userId): array;
}
