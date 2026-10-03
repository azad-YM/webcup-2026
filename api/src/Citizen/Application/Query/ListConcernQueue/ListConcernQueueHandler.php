<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListConcernQueue;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\ViewModel\ConcernView;
use Citizen\Domain\Entity\Concern;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Inquiétudes à traiter par les agents (sans identité du citoyen), les plus anciennes d'abord. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListConcernQueueHandler
{
    public const LIMIT = 100;

    public function __construct(private RequestAccessPolicy $access, private ConcernRepository $concerns) {}

    /** @return array{items: list<ConcernView>, receivedCount: int, canProcess: bool} */
    public function __invoke(ListConcernQueueQuery $query): array
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading concerns requires the admin.request.read permission.');
        }
        if ($query->status !== null && !in_array($query->status, Concern::STATUSES, true)) {
            throw new DomainException('Unknown status filter.');
        }

        return [
            'items' => array_map(ConcernView::from(...), $this->concerns->findQueue($query->status, self::LIMIT)),
            'receivedCount' => $this->concerns->countByStatus(Concern::RECEIVED),
            'canProcess' => $this->access->canProcessRequests(),
        ];
    }
}
