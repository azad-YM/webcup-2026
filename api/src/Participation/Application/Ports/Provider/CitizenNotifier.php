<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Provider;

use Participation\Application\DTO\CitizenNotice;

/**
 * Notifications belong to Citizen (table `citizen_notifications`): implemented by
 * `Citizen/Infrastructure/Adapter/Participation/CitizenParticipationNotifier`, in the current transaction.
 * Sending the same `sourceKey` twice creates nothing.
 */
interface CitizenNotifier
{
    public function notify(CitizenNotice $notice): void;
}
