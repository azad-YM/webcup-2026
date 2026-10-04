<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Provider;

/** Who may read the journal. Implemented by the BC that owns the agents and their permissions (Administration). */
interface AuditAccessPolicy
{
    /** Read the action journal (`admin.audit.read`). */
    public function canReadAuditTrail(): bool;

    /** Also see the login security entries (blocked logins: e-mail, IP), reserved to `admin.security.read`. */
    public function canReadSecurityEntries(): bool;

    /** F100 : any active member of the administration (agent or administrator) follows the latest security events. */
    public function canReadSecurityEvents(): bool;
}
