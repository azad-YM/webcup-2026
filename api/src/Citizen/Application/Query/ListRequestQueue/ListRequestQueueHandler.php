<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestQueue;

use Citizen\Application\Service\SensitiveDataDisclosure;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestQueue;
use Citizen\Application\ViewModel\ServiceRequestView;
use Citizen\Domain\Entity\ServiceRequest;
use Citizen\Domain\Service\RequestTriage;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListRequestQueueHandler
{
    public const PAGE_SIZE = 20;

    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private ?SensitiveDataDisclosure $disclosure = null,
        private ?RequestMessageRepository $messages = null,
    ) {}

    public function __invoke(ListRequestQueueQuery $query): RequestQueue
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading requests requires the admin.request.read permission.');
        }
        if ($query->status !== null && !in_array($query->status, ServiceRequest::STATUSES, true)) {
            throw new DomainException('Unknown status filter.');
        }
        if ($query->priority !== null && !in_array($query->priority, RequestTriage::PRIORITIES, true)) {
            throw new DomainException('Unknown priority filter.');
        }
        $page = max(1, $query->page);
        $items = $this->requests->findQueue($query->status, ($page - 1) * self::PAGE_SIZE, self::PAGE_SIZE, $query->priority);

        // F70 : le lieu d'une demande de contact (souvent le domicile) n'est affiché qu'à un agent habilité qui le demande.
        $revealed = $query->reveal && $this->disclosure !== null && $this->disclosure->canReveal();
        $messages = $this->messages?->countByRequests(array_map(fn (ServiceRequest $request) => $request->id, $items)) ?? [];
        $views = array_map(fn (ServiceRequest $request) => ServiceRequestView::fromRequest($request)->withMessageCount($messages[$request->id] ?? 0), $items);
        if ($revealed) {
            $this->disclosure?->reveal(true, 'request-queue', count(array_filter($views, fn (ServiceRequestView $view) => $view->type === 'contact' && ($view->location ?? '') !== '')));
        } else {
            $views = array_map(fn (ServiceRequestView $view) => $view->type === 'contact' ? $view->withMaskedLocation() : $view, $views);
        }

        return new RequestQueue(
            $views,
            $this->requests->countByStatus($query->status, $query->priority),
            $this->requests->countByStatus(ServiceRequest::SUBMITTED),
            $page,
            self::PAGE_SIZE,
            $this->access->canProcessRequests(),
            $this->disclosure?->meta($revealed) ?? ['revealed' => false, 'canReveal' => false],
            $this->requests->countOpenByPriority(RequestTriage::URGENT),
            // F86 : bandeau persistant tant qu'une urgence médicale n'est pas prise en charge (sans lieu ni message).
            array_map(fn (ServiceRequest $request) => [
                'id' => $request->id,
                'reference' => $request->reference,
                'subject' => $request->subject,
                'createdAt' => $request->createdAt->format(\DateTimeInterface::ATOM),
            ], $this->requests->findUnhandledEmergencies(10)),
        );
    }
}
