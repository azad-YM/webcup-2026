<?php

declare(strict_types=1);

namespace Citizen\Application\Service;

use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Service\RequestReceiptSigner;
use Citizen\Application\ViewModel\RequestReceiptView;
use Citizen\Domain\Entity\ServiceRequest;

/**
 * F83 : construit et vérifie l'accusé de réception. L'empreinte couvre l'identifiant, la référence, la date
 * d'envoi et l'objet : un accusé modifié (date, objet) ne se vérifie plus.
 */
final readonly class RequestReceipts
{
    public function __construct(
        private RequestReceiptSigner $signer,
        private ?MunicipalServiceDirectory $services = null,
    ) {}

    public function receipt(ServiceRequest $request): RequestReceiptView
    {
        $service = $request->serviceId !== null ? $this->services?->find($request->serviceId) : null;

        return new RequestReceiptView(
            $request->reference,
            $request->type,
            $request->subject,
            $request->serviceId,
            $service?->name,
            $request->createdAt->format(\DateTimeInterface::ATOM),
            $this->fingerprint($request),
            $request->isMedicalEmergency(),
        );
    }

    public function matches(ServiceRequest $request, string $fingerprint): bool
    {
        $normalize = fn (string $value) => strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $value));

        return hash_equals($normalize($this->fingerprint($request)), $normalize($fingerprint));
    }

    private function fingerprint(ServiceRequest $request): string
    {
        return $this->signer->fingerprint(implode('|', [
            $request->id,
            $request->reference,
            $request->createdAt->format(\DateTimeInterface::ATOM),
            $request->subject,
        ]));
    }
}
