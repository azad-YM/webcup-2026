<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeRequestStatus;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ChangeRequestStatusHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private IClock $clock,
    ) {}

    public function __invoke(ChangeRequestStatusCommand $cmd): ServiceRequestView
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Processing requests requires the admin.request.write permission.');
        }
        $request = $this->requests->findById($cmd->requestId)
            ?? throw new NotFoundException('Request not found.');
        if ($request->status() !== $cmd->expectedStatus) {
            throw new ConflitException('The request has changed in the meantime. Refresh and retry.');
        }
        $request->changeStatus($cmd->status, $cmd->comment, $this->clock->now());
        $this->requests->save($request);

        return ServiceRequestView::fromRequest($request);
    }
}
