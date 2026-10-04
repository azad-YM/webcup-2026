<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider\Report;

use Pilotage\Application\DTO\Report\DirectoryService;

/** F98 : catalogue des services (nom, thème, état) pour nommer les usages. Implémenté par Administration. */
interface ServiceDirectory
{
    /** @return list<DirectoryService> */
    public function services(): array;
}
