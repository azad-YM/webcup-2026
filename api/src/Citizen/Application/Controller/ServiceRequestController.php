<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\ChangeRequestStatus\ChangeRequestStatusCommand;
use Citizen\Application\Command\SubmitServiceRequest\SubmitServiceRequestCommand;
use Citizen\Application\Query\GetMyServiceRequest\GetMyServiceRequestQuery;
use Citizen\Application\Query\ListMyServiceRequests\ListMyServiceRequestsQuery;
use Citizen\Application\Query\ListRequestQueue\ListRequestQueueQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class ServiceRequestController extends AppController
{
    #[Route('/api/citizen/requests', name: 'citizen_submit_request', methods: ['POST'], format: 'json')]
    public function submit(#[MapRequestPayload] SubmitServiceRequestCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/requests', name: 'citizen_my_requests', methods: ['GET'], format: 'json')]
    public function mine(): JsonResponse
    {
        return $this->dispatchQuery(new ListMyServiceRequestsQuery());
    }

    #[Route('/api/citizen/requests/{reference}', name: 'citizen_my_request', methods: ['GET'], format: 'json', requirements: ['reference' => '[A-Za-z0-9-]{1,50}'])]
    public function detail(string $reference): JsonResponse
    {
        return $this->dispatchQuery(new GetMyServiceRequestQuery($reference));
    }

    #[Route('/api/citizen/agent/requests', name: 'citizen_request_queue', methods: ['GET'], format: 'json')]
    public function queue(Request $request): JsonResponse
    {
        $status = $request->query->get('status');

        return $this->dispatchQuery(new ListRequestQueueQuery(
            is_string($status) && $status !== '' ? $status : null,
            max(1, $request->query->getInt('page', 1)),
            $request->query->getBoolean('reveal'),
        ));
    }

    #[Route('/api/citizen/agent/requests/status', name: 'citizen_change_request_status', methods: ['POST'], format: 'json')]
    public function changeStatus(#[MapRequestPayload] ChangeRequestStatusCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
