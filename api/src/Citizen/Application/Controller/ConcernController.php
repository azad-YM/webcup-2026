<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\HandleConcern\HandleConcernCommand;
use Citizen\Application\Command\RaiseConcern\RaiseConcernCommand;
use Citizen\Application\Query\ListConcernQueue\ListConcernQueueQuery;
use Citizen\Application\Query\ListMyConcerns\ListMyConcernsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Inquiétudes des habitants (lot L14, F51). */
final class ConcernController extends AppController
{
    #[Route('/api/citizen/concerns', name: 'citizen_raise_concern', methods: ['POST'], format: 'json')]
    public function raise(#[MapRequestPayload] RaiseConcernCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/concerns', name: 'citizen_my_concerns', methods: ['GET'], format: 'json')]
    public function mine(): JsonResponse
    {
        return $this->dispatchQuery(new ListMyConcernsQuery());
    }

    #[Route('/api/citizen/agent/concerns', name: 'citizen_concern_queue', methods: ['GET'], format: 'json')]
    public function queue(Request $request): JsonResponse
    {
        $status = $request->query->get('status');

        return $this->dispatchQuery(new ListConcernQueueQuery(is_string($status) && $status !== '' ? $status : null));
    }

    #[Route('/api/citizen/agent/concerns/handle', name: 'citizen_handle_concern', methods: ['POST'], format: 'json')]
    public function handle(#[MapRequestPayload] HandleConcernCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
