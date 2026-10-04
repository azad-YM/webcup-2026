<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyRequestReceipt;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Service\RequestReceipts;
use Citizen\Application\ViewModel\RequestReceiptView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F83 : accusé de réception d'une demande de l'habitant connecté (404 pour celle d'un autre). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyRequestReceiptHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ServiceRequestRepository $requests,
        private RequestReceipts $receipts,
    ) {}

    public function __invoke(GetMyRequestReceiptQuery $query): RequestReceiptView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $request = $this->requests->findByReference(strtoupper(trim($query->reference)));
        if ($request === null || $request->citizenId !== $citizen->id) {
            throw new NotFoundException('Request not found.');
        }

        return $this->receipts->receipt($request);
    }
}
