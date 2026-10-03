<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Service;

use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/** Additional citizen-owned data erased in the account deletion transaction (e.g. lot L2 requests attachments). */
#[AutoconfigureTag('citizen.account_data_eraser')]
interface AccountDataEraser
{
    public function erase(string $citizenId): void;
}
