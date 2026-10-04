<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ReassessRequestPriorities;

use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class ReassessRequestPrioritiesHandler
{
    public function __construct(
        private ServiceRequestRepository $requests,
        private RequestSupportRepository $supports,
        private IClock $clock,
    ) {}

    /** @return array{checked: int, changed: int} */
    public function __invoke(ReassessRequestPrioritiesCommand $cmd): array
    {
        $now = $this->clock->now();
        $requests = $this->requests->findOpenAutoPrioritized(max(1, min(5000, $cmd->limit)));
        $counts = $this->supports->countByRequests(array_map(fn ($request) => $request->id, $requests));
        $changed = 0;
        foreach ($requests as $request) {
            $before = [$request->priority(), $request->priorityReason()];
            if ($request->reassessPriority($counts[$request->id] ?? 0, $now)) {
                ++$changed;
            }
            if ($before !== [$request->priority(), $request->priorityReason()]) {
                $this->requests->save($request);
            }
        }

        return ['checked' => count($requests), 'changed' => $changed];
    }
}
