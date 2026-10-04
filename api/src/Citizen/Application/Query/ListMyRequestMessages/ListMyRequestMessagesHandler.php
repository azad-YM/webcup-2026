<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyRequestMessages;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestMessageView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyRequestMessagesHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestMessageRepository $messages,
    ) {}

    /** @return array{items: list<RequestMessageView>, canReply: bool} */
    public function __invoke(ListMyRequestMessagesQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $request = $this->requests->findByReference(strtoupper(trim($query->reference)));
        if ($request === null || $request->citizenId !== $citizen->id) {
            throw new NotFoundException('Request not found.');
        }

        return [
            'items' => array_map(RequestMessageView::from(...), $this->messages->findByRequest($request->id)),
            'canReply' => !$request->isClosed(),
        ];
    }
}
