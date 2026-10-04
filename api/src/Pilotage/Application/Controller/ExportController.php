<?php

declare(strict_types=1);

namespace Pilotage\Application\Controller;

use Pilotage\Application\Command\ExportTrackingData\ExportTrackingDataCommand;
use Pilotage\Application\Query\ListExportDatasets\ListExportDatasetsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** F88 : écran « Exports » de l'admin. */
final class ExportController extends AppController
{
    #[Route('/api/pilotage/exports', name: 'get_pilotage_export_datasets', methods: ['GET'], format: 'json')]
    public function datasets(): JsonResponse
    {
        return $this->dispatchQuery(new ListExportDatasetsQuery());
    }

    #[Route('/api/pilotage/exports', name: 'post_pilotage_export', methods: ['POST'], format: 'json')]
    public function export(#[MapRequestPayload] ExportTrackingDataCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
