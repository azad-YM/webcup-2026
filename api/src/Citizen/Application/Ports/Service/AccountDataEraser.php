<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Service;

/** Additional citizen-owned data erased in the account deletion transaction. */
interface AccountDataEraser
{
    public function erase(string $citizenId): void;
}
