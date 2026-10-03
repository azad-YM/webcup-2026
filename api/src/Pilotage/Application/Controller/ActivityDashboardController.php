<?php

declare(strict_types=1);

namespace Pilotage\Application\Controller;

use Pilotage\Application\Query\GetActivityDashboard\GetActivityDashboardQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ActivityDashboardController extends AppController
{
    #[Route('/api/pilotage/activity', name: 'get_pilotage_activity', methods: ['GET'], format: 'json')]
    public function show(): JsonResponse
    {
        return $this->dispatchQuery(new GetActivityDashboardQuery());
    }
}
