<?php

declare(strict_types=1);

namespace Pilotage\Application\Ports\Gateway;

use Pilotage\Application\Exception\WebcupApiKeyMissing;
use Pilotage\Application\Exception\WebcupApiKeyRejected;
use Pilotage\Application\Exception\WebcupFeedUnavailable;
use Pilotage\Domain\Model\WebcupFeed;

/** Source of the contest feed. Implementations may serve a recent snapshot instead of calling the API each time. */
interface WebcupFeedGateway
{
    /**
     * @throws WebcupApiKeyMissing   no key is configured on the server
     * @throws WebcupApiKeyRejected  the contest API refused the key
     * @throws WebcupFeedUnavailable outage, timeout or unreadable answer
     */
    public function fetch(): WebcupFeed;
}
