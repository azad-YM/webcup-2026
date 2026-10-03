<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Provider;

use Audit\Application\DTO\AuditActor;

/** Who is acting right now. Implemented by the BC that owns the accounts (IAM). */
interface AuditActorProvider
{
    /** The connected account, or null outside an authenticated request (CLI, anonymous login attempt). */
    public function current(): ?AuditActor;
}
