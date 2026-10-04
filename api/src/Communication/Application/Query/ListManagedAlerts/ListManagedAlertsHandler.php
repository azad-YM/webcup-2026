<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListManagedAlerts;

use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Application\Ports\Repository\AlertRepository;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Every alerts, drafts and withdrawn ones included, for the agents (most recently updated first). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListManagedAlertsHandler
{
    public function __construct(private AlertRepository $alerts, private CommunicationAccessPolicy $access) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListManagedAlertsQuery $query): array
    {
        if (!$this->access->canPublish()) {
            throw new AccessDeniedException('Permission de publication requise.');
        }
        $views = array_map(fn ($item) => $item->managementView(), $this->alerts->all());
        usort($views, fn (array $a, array $b) => $b['updatedAt'] <=> $a['updatedAt']);

        return $views;
    }
}
