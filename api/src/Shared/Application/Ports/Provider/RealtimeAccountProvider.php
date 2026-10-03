<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Provider;

/** Identifies the connected account for the realtime stream; implemented by IAM. */
interface RealtimeAccountProvider
{
    /** Account identifier of the authenticated request, or null for an anonymous visitor. */
    public function currentUserId(): ?string;
}
