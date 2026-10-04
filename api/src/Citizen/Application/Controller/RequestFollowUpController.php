<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\ChangeGroupStatus\ChangeGroupStatusCommand;
use Citizen\Application\Command\LinkRequests\LinkRequestsCommand;
use Citizen\Application\Command\MarkEmergencyHandled\MarkEmergencyHandledCommand;
use Citizen\Application\Command\PostMyRequestMessage\PostMyRequestMessageCommand;
use Citizen\Application\Command\ReplyToRequest\ReplyToRequestCommand;
use Citizen\Application\Command\SetRequestPriority\SetRequestPriorityCommand;
use Citizen\Application\Command\UnlinkRequest\UnlinkRequestCommand;
use Citizen\Application\Query\FindSimilarRequests\FindSimilarRequestsQuery;
use Citizen\Application\Query\GetMyRequestReceipt\GetMyRequestReceiptQuery;
use Citizen\Application\Query\ListMyRequestMessages\ListMyRequestMessagesQuery;
use Citizen\Application\Query\ListRequestMessages\ListRequestMessagesQuery;
use Citizen\Application\Query\VerifyRequestReceipt\VerifyRequestReceiptQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Lot L23 : suivi des demandes à grande échelle — priorité (F80), urgence médicale (F86), demandes similaires (F75),
 * messages agent ↔ habitant (F84), accusé de réception (F83).
 */
final class RequestFollowUpController extends AppController
{
    private const REFERENCE = '[A-Za-z0-9-]{1,50}';
    private const ID = '[A-Za-z0-9-]{1,36}';

    // --- Habitant connecté ---

    #[Route('/api/citizen/requests/{reference}/messages', name: 'citizen_my_request_messages', methods: ['GET'], format: 'json', requirements: ['reference' => self::REFERENCE])]
    public function myMessages(string $reference): JsonResponse
    {
        return $this->dispatchQuery(new ListMyRequestMessagesQuery($reference));
    }

    #[Route('/api/citizen/requests/messages', name: 'citizen_post_request_message', methods: ['POST'], format: 'json')]
    public function postMessage(#[MapRequestPayload] PostMyRequestMessageCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/requests/{reference}/receipt', name: 'citizen_my_request_receipt', methods: ['GET'], format: 'json', requirements: ['reference' => self::REFERENCE])]
    public function receipt(string $reference): JsonResponse
    {
        return $this->dispatchQuery(new GetMyRequestReceiptQuery($reference));
    }

    /** Public, limité en débit : répond seulement si l'accusé est authentique, sans contenu. */
    #[Route('/api/citizen/receipts/verify', name: 'citizen_verify_receipt', methods: ['POST'], format: 'json')]
    public function verify(#[MapRequestPayload] VerifyRequestReceiptQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    // --- Agents (admin.request.read ; actions : admin.request.write) ---

    #[Route('/api/citizen/agent/requests/priority', name: 'citizen_set_request_priority', methods: ['POST'], format: 'json')]
    public function priority(#[MapRequestPayload] SetRequestPriorityCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/requests/emergency-handled', name: 'citizen_mark_emergency_handled', methods: ['POST'], format: 'json')]
    public function emergencyHandled(#[MapRequestPayload] MarkEmergencyHandledCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/requests/{requestId}/similar', name: 'citizen_similar_requests', methods: ['GET'], format: 'json', requirements: ['requestId' => self::ID])]
    public function similar(string $requestId): JsonResponse
    {
        return $this->dispatchQuery(new FindSimilarRequestsQuery($requestId));
    }

    #[Route('/api/citizen/agent/requests/link', name: 'citizen_link_requests', methods: ['POST'], format: 'json')]
    public function link(#[MapRequestPayload] LinkRequestsCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/requests/unlink', name: 'citizen_unlink_request', methods: ['POST'], format: 'json')]
    public function unlink(#[MapRequestPayload] UnlinkRequestCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/requests/group-status', name: 'citizen_change_group_status', methods: ['POST'], format: 'json')]
    public function groupStatus(#[MapRequestPayload] ChangeGroupStatusCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/requests/{requestId}/messages', name: 'citizen_request_messages', methods: ['GET'], format: 'json', requirements: ['requestId' => self::ID])]
    public function messages(string $requestId): JsonResponse
    {
        return $this->dispatchQuery(new ListRequestMessagesQuery($requestId));
    }

    #[Route('/api/citizen/agent/requests/messages', name: 'citizen_reply_to_request', methods: ['POST'], format: 'json')]
    public function reply(#[MapRequestPayload] ReplyToRequestCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
