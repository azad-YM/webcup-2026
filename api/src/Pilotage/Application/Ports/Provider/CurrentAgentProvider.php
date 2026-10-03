<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Provider;

use Pilotage\Application\DTO\AgentIdentity;

/** The connected agent, recorded as author of a tracking update. Implemented by IAM. */
interface CurrentAgentProvider
{
    public function current(): AgentIdentity;
}
