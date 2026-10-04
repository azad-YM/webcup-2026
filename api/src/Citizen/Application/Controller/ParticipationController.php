<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\SupportRequest\SupportRequestCommand;
use Citizen\Application\Query\ListPublicRequests\ListPublicRequestsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Participation (lot L14) : soutien des signalements publics (F52). */
final class ParticipationController extends AppController
{
    #[Route('/api/citizen/public-requests', name: 'citizen_public_requests', methods: ['GET'], format: 'json')]
    public function publicRequests(): JsonResponse
    {
        return $this->dispatchQuery(new ListPublicRequestsQuery());
    }

    #[Route('/api/citizen/public-requests/support', name: 'citizen_support_request', methods: ['POST'], format: 'json')]
    public function support(#[MapRequestPayload] SupportRequestCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
