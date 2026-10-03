<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Provider;

use Communication\Application\DTO\Audience;

/** Implemented by Citizen (`Citizen/Infrastructure/Adapter/Communication`). */
interface AudienceProvider
{
    /** Audience of the connected account, or null when it is not a citizen. */
    public function current(): ?Audience;
}
