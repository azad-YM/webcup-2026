<?php

declare(strict_types=1);

namespace Audit\Application\Controller;

use Audit\Application\Command\ChangeAnomalyStatus\ChangeAnomalyStatusCommand;
use Audit\Application\Command\ScanUnusualActivity\ScanUnusualActivityCommand;
use Audit\Application\Query\ListAnomalies\ListAnomaliesQuery;
use Audit\Application\Query\SummarizeAnomalies\SummarizeAnomaliesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** F85 : écran « Activité inhabituelle » de l'admin (`admin.security.read`). */
final class AnomalyController extends AppController
{
    #[Route('/api/audit/anomalies', name: 'audit_list_anomalies', methods: ['GET'], format: 'json')]
    public function list(Request $request): JsonResponse
    {
        $status = $request->query->get('status');
        $severity = $request->query->get('severity');

        return $this->dispatchQuery(new ListAnomaliesQuery(is_string($status) ? $status : null, is_string($severity) ? $severity : null));
    }

    #[Route('/api/audit/anomalies/scan', name: 'audit_scan_anomalies', methods: ['POST'], format: 'json')]
    public function scan(): JsonResponse
    {
        return $this->dispatch(new ScanUnusualActivityCommand('manual'));
    }

    #[Route('/api/audit/anomalies/status', name: 'audit_anomaly_status', methods: ['PUT'], format: 'json')]
    public function status(#[MapRequestPayload] ChangeAnomalyStatusCommand $command): JsonResponse
    {
        return $this->dispatch($command);
    }

    #[Route('/api/audit/anomalies/summary', name: 'audit_anomaly_summary', methods: ['GET'], format: 'json')]
    public function summary(): JsonResponse
    {
        return $this->dispatchQuery(new SummarizeAnomaliesQuery());
    }
}
