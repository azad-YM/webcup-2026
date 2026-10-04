<?php

declare(strict_types=1);

namespace Pilotage\Application\Controller;

use Pilotage\Application\Query\GetActivityDashboard\GetActivityDashboardQuery;
use Pilotage\Application\Query\GetActivityReport\GetActivityReportQuery;
use Pilotage\Application\Query\GetServiceUsage\GetServiceUsageQuery;
use Symfony\Component\HttpFoundation\Request;
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

    /** F98 : services les plus utilisés (`?days=30`, ou `?from=AAAA-MM-JJ&to=AAAA-MM-JJ`). */
    #[Route('/api/pilotage/service-usage', name: 'get_pilotage_service_usage', methods: ['GET'], format: 'json')]
    public function serviceUsage(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new GetServiceUsageQuery(...self::period($request)));
    }

    /** F103 : rapport synthétique de l'activité (mêmes paramètres de période). */
    #[Route('/api/pilotage/activity-report', name: 'get_pilotage_activity_report', methods: ['GET'], format: 'json')]
    public function activityReport(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new GetActivityReportQuery(...self::period($request)));
    }

    /** @return array{days: ?int, from: ?string, to: ?string} */
    private static function period(Request $request): array
    {
        return [
            'days' => $request->query->has('days') ? $request->query->getInt('days') : null,
            'from' => $request->query->getString('from') ?: null,
            'to' => $request->query->getString('to') ?: null,
        ];
    }
}
