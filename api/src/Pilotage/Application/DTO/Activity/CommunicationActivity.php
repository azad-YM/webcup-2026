<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Activity;

/** Contract of `CommunicationActivityProvider`: alerts and publications, counted by Communication. */
final readonly class CommunicationActivity
{
    public function __construct(
        /** Published alerts in their validity period now. */
        public int $activeAlerts,
        /** Of which critical. */
        public int $criticalAlerts,
        /** Published alerts whose validity starts later. */
        public int $scheduledAlerts,
        public int $publishedPublications,
        public int $draftPublications,
    ) {}
}
