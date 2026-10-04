<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestMessages;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestMessageView;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListRequestMessagesHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private RequestMessageRepository $messages,
    ) {}

    /** @return array{items: list<RequestMessageView>} */
    public function __invoke(ListRequestMessagesQuery $query): array
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading requests requires the admin.request.read permission.');
        }
        $request = $this->requests->findById($query->requestId) ?? throw new NotFoundException('Request not found.');

        return ['items' => array_map(RequestMessageView::from(...), $this->messages->findByRequest($request->id))];
    }
}
