<?php

declare(strict_types=1);

namespace Pilotage\Application\Exception;

use Shared\Application\Exception\ApiException;

final class WebcupApiKeyMissing extends ApiException
{
    public function __construct()
    {
        parent::__construct('La clé de l’API du concours n’est pas configurée sur le serveur (WEBCUP_API_KEY).', 503, 'webcup_api_key_missing');
    }
}
