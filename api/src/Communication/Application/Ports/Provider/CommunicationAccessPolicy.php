<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Provider;

/** Implemented by Administration (`Administration/Infrastructure/Adapter/Communication`, permission `admin.communication.write`). */
interface CommunicationAccessPolicy
{
    public function canPublish(): bool;
}
