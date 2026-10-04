<?php

declare(strict_types=1);

namespace Pilotage\Application\Controller;

use Pilotage\Application\Query\GetWebcupFeed\GetWebcupFeedQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class WebcupFeedController extends AppController
{
    #[Route('/api/pilotage/webcup-feed', name: 'get_pilotage_webcup_feed', methods: ['GET'], format: 'json')]
    public function show(): JsonResponse
    {
        return $this->dispatchQuery(new GetWebcupFeedQuery());
    }
}
