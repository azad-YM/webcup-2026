<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Provider;

/** IAM asks the organisation owner (Administration) whether the connected account may read the login security journal. */
interface SecurityJournalAccessPolicy
{
    public function canReadSecurityJournal(): bool;
}
