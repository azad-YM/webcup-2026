<?php

declare(strict_types=1);

namespace Citizen\Application\Command\LinkRequests;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class LinkRequestsHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private IIdProvider $ids,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array{groupId: string, references: list<string>} */
    public function __invoke(LinkRequestsCommand $cmd): array
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Linking requests requires the admin.request.write permission.');
        }
        $anchor = $this->requests->findById($cmd->requestId) ?? throw new NotFoundException('Request not found.');
        $otherIds = array_values(array_unique(array_filter($cmd->otherIds, fn (string $id) => $id !== $anchor->id)));
        $others = $this->requests->findByIds($otherIds);
        if (count($others) !== count($otherIds) || $others === []) {
            throw new NotFoundException('One of the requests to link was not found.');
        }
        $now = $this->clock->now();
        $groupId = $anchor->groupId() ?? $this->ids->getId();
        // Une demande déjà dans un autre groupe y emmène tout ce groupe : les deux problèmes n'en font plus qu'un.
        $members = [$anchor, ...$others];
        foreach ($others as $other) {
            if ($other->groupId() !== null && $other->groupId() !== $groupId) {
                foreach ($this->requests->findByGroup($other->groupId()) as $member) {
                    $members[] = $member;
                }
            }
        }
        $references = [];
        foreach ($members as $member) {
            $member->linkToGroup($groupId, $now);
            $this->requests->save($member);
            $references[$member->id] = $member->reference;
        }
        $references = array_values($references);
        $this->audit?->record(
            'citizen.request.linked',
            'service-request-group',
            $groupId,
            sprintf('Demandes liées comme un même problème : %s.', implode(', ', $references)),
            ['references' => $references],
        );

        return ['groupId' => $groupId, 'references' => $references];
    }
}
