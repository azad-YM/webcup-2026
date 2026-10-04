<?php

declare(strict_types=1);

namespace Citizen\Application\Query\VerifyRequestReceipt;

use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Service\RequestReceipts;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Répond seulement « authentique » (avec la date de réception) ou « non reconnu » : une référence inconnue et une
 * empreinte fausse donnent la même réponse, et ni l'objet ni l'auteur ne sont révélés.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class VerifyRequestReceiptHandler
{
    public function __construct(private ServiceRequestRepository $requests, private RequestReceipts $receipts) {}

    /** @return array{valid: bool, reference: string, submittedAt: ?string} */
    public function __invoke(VerifyRequestReceiptQuery $query): array
    {
        $reference = strtoupper(trim($query->reference));
        $request = preg_match('/^[A-Z0-9-]{1,30}$/', $reference) === 1 ? $this->requests->findByReference($reference) : null;
        $valid = $request !== null && $this->receipts->matches($request, $query->fingerprint);

        return [
            'valid' => $valid,
            'reference' => $reference,
            'submittedAt' => $valid ? $request->createdAt->format(\DateTimeInterface::ATOM) : null,
        ];
    }
}
