<?php

declare(strict_types=1);

namespace Pilotage\Application\Exception;

use Shared\Application\Exception\ApiException;

final class WebcupApiKeyRejected extends ApiException
{
    public function __construct()
    {
        parent::__construct('Clé refusée par l’API du concours.', 502, 'webcup_api_key_rejected');
    }
}
