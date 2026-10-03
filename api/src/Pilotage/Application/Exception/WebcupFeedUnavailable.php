<?php

declare(strict_types=1);

namespace Pilotage\Application\Exception;

use Shared\Application\Exception\ApiException;

final class WebcupFeedUnavailable extends ApiException
{
    public function __construct(string $reason = 'L’API du concours est injoignable ou a renvoyé une réponse illisible.')
    {
        parent::__construct($reason, 502, 'webcup_feed_unavailable');
    }
}
