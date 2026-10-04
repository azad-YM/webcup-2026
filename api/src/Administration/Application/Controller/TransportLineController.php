<?php

declare(strict_types=1);

namespace Administration\Application\Controller;

use Administration\Application\Command\SaveTransportLine\SaveTransportLineCommand;
use Administration\Application\Query\ListTransportLines\ListTransportLinesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** F97 : lignes de transport (lecture publique, mise à jour par les agents `admin.service.write`). */
final class TransportLineController extends AppController
{
    #[Route('/api/administration/transport-lines', name: 'administration_transport_lines', methods: ['GET'], format: 'json')]
    public function list(): JsonResponse
    {
        return $this->dispatchQuery(new ListTransportLinesQuery());
    }

    #[Route('/api/administration/transport-lines', name: 'administration_save_transport_line', methods: ['PUT'], format: 'json')]
    public function save(#[MapRequestPayload] SaveTransportLineCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
