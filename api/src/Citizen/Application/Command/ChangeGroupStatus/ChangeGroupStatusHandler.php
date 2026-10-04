<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeGroupStatus;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Domain\Entity\ServiceRequest;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeGroupStatusHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array{changed: list<string>, skipped: list<string>} références changées et ignorées (transition impossible) */
    public function __invoke(ChangeGroupStatusCommand $cmd): array
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Processing requests requires the admin.request.write permission.');
        }
        $members = $this->requests->findByGroup($cmd->groupId);
        if ($members === []) {
            throw new NotFoundException('Group not found.');
        }
        if ($cmd->status === ServiceRequest::REJECTED && trim($cmd->comment ?? '') === '') {
            throw new \DomainException('A rejection requires a reason.');
        }
        $now = $this->clock->now();
        $changed = [];
        $skipped = [];
        foreach ($members as $member) {
            if (!in_array($cmd->status, $member->allowedTransitions(), true)) {
                $skipped[] = $member->reference;
                continue;
            }
            $member->changeStatus($cmd->status, $cmd->comment, $now);
            $this->requests->save($member);
            $changed[] = $member->reference;
        }
        if ($changed !== []) {
            $this->audit?->record(
                'citizen.request.group_status_changed',
                'service-request-group',
                $cmd->groupId,
                sprintf('Groupe de demandes passé à « %s » : %s.', $cmd->status, implode(', ', $changed)),
                ['status' => $cmd->status, 'changed' => $changed, 'skipped' => $skipped],
            );
        }

        return ['changed' => $changed, 'skipped' => $skipped];
    }
}
