<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SupportRequest;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\PublicRequestView;
use Citizen\Domain\Entity\RequestSupport;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F52 : un soutien par citoyen ; une demande privée répond 404, comme une demande inconnue. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SupportRequestHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestSupportRepository $supports,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    public function __invoke(SupportRequestCommand $cmd): PublicRequestView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $request = $this->requests->findById($cmd->requestId);
        if ($request === null || !$request->isPublic()) {
            throw new NotFoundException('Request not found.');
        }
        $existing = $this->supports->find($request->id, $citizen->id);
        if ($cmd->support && $existing === null) {
            $this->supports->save(RequestSupport::give($this->ids->getId(), $request, $citizen->id, $this->clock->now()));
        } elseif (!$cmd->support && $existing !== null) {
            $this->supports->remove($existing);
        }
        $count = ($this->supports->countByRequests([$request->id])[$request->id] ?? 0)
            + ($cmd->support && $existing === null ? 1 : 0) - (!$cmd->support && $existing !== null ? 1 : 0);

        return PublicRequestView::from($request, max(0, $count), $cmd->support, $citizen->id);
    }
}
