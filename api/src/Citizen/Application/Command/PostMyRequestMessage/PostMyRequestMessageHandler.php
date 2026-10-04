<?php

declare(strict_types=1);

namespace Citizen\Application\Command\PostMyRequestMessage;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestMessageView;
use Citizen\Domain\Entity\RequestMessage;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class PostMyRequestMessageHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestMessageRepository $messages,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    public function __invoke(PostMyRequestMessageCommand $cmd): RequestMessageView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $request = $this->requests->findByReference(strtoupper(trim($cmd->reference)));
        if ($request === null || $request->citizenId !== $citizen->id) {
            throw new NotFoundException('Request not found.');
        }
        $message = RequestMessage::post($this->ids->getId(), $request, RequestMessage::AUTHOR_CITIZEN, null, $cmd->body, $this->clock->now());
        $this->messages->save($message);

        return RequestMessageView::from($message);
    }
}
