<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\ServiceRequest;

/** Signalement public vu par les autres habitants (F52) : sujet, lieu, état ; ni auteur, ni description. */
final readonly class PublicRequestView
{
    public function __construct(
        public string $id,
        public string $reference,
        public string $subject,
        public ?string $location,
        public string $status,
        public string $createdAt,
        public int $supportCount,
        public bool $supportedByMe,
        public bool $mine,
        /** F79 : filtres par sujet (service, catégorie) et quartier. */
        public ?string $serviceId = null,
        public string $category = 'other',
        public ?string $district = null,
    ) {}

    public static function from(ServiceRequest $request, int $supportCount, bool $supportedByMe, string $viewerCitizenId): self
    {
        return new self(
            $request->id,
            $request->reference,
            $request->subject,
            $request->location,
            $request->status(),
            $request->createdAt->format(\DateTimeInterface::ATOM),
            $supportCount,
            $supportedByMe,
            $request->citizenId === $viewerCitizenId,
            $request->serviceId,
            // Une urgence médicale n'est jamais publique (message privé) ; par prudence, la catégorie n'est pas exposée.
            $request->isMedicalEmergency() ? 'other' : $request->category(),
            $request->district(),
        );
    }
}
