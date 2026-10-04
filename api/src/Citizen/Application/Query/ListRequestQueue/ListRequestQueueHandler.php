<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestQueue;

use Citizen\Application\Service\SensitiveDataDisclosure;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\RequestQueue;
use Citizen\Application\ViewModel\ServiceRequestView;
use Citizen\Domain\Entity\ServiceRequest;
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
    ) {}

    public function __invoke(ListRequestQueueQuery $query): RequestQueue
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading requests requires the admin.request.read permission.');
        }
        if ($query->status !== null && !in_array($query->status, ServiceRequest::STATUSES, true)) {
            throw new DomainException('Unknown status filter.');
        }
        $page = max(1, $query->page);
        $items = $this->requests->findQueue($query->status, ($page - 1) * self::PAGE_SIZE, self::PAGE_SIZE);

        // F70 : le lieu d'une demande de contact (souvent le domicile) n'est affiché qu'à un agent habilité qui le demande.
        $revealed = $query->reveal && $this->disclosure !== null && $this->disclosure->canReveal();
        $views = array_map(ServiceRequestView::fromRequest(...), $items);
        if ($revealed) {
            $this->disclosure?->reveal(true, 'request-queue', count(array_filter($views, fn (ServiceRequestView $view) => $view->type === 'contact' && ($view->location ?? '') !== '')));
        } else {
            $views = array_map(fn (ServiceRequestView $view) => $view->type === 'contact' ? $view->withMaskedLocation() : $view, $views);
        }

        return new RequestQueue(
            $views,
            $this->requests->countByStatus($query->status),
            $this->requests->countByStatus(ServiceRequest::SUBMITTED),
            $page,
            self::PAGE_SIZE,
            $this->access->canProcessRequests(),
            $this->disclosure?->meta($revealed) ?? ['revealed' => false, 'canReveal' => false],
        );
    }
}
