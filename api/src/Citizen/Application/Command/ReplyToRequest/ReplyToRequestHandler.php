<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ReplyToRequest;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestMessageView;
use Citizen\Domain\Entity\RequestMessage;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class ReplyToRequestHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestMessageRepository $messages,
        private IIdProvider $ids,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    public function __invoke(ReplyToRequestCommand $cmd): RequestMessageView
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Replying requires the admin.request.write permission.');
        }
        $request = $this->requests->findById($cmd->requestId) ?? throw new NotFoundException('Request not found.');
        $message = RequestMessage::post($this->ids->getId(), $request, RequestMessage::AUTHOR_AGENT, $this->identity->userId(), $cmd->body, $this->clock->now());
        $this->messages->save($message);
        $this->audit?->record(
            'citizen.request.replied',
            'service-request',
            $request->id,
            sprintf('Réponse envoyée à l’habitant sur la demande %s.', $request->reference),
            ['reference' => $request->reference, 'length' => mb_strlen($message->body)],
        );

        return RequestMessageView::from($message);
    }
}
