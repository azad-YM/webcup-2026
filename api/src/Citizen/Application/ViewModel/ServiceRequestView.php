<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\ServiceRequest;

final readonly class ServiceRequestView
{
    /**
     * @param list<array{status: string, at: string, comment: ?string}> $steps
     * @param list<string>                                              $allowedTransitions
     */
    public function __construct(
        public string $id,
        public string $reference,
        public string $type,
        public ?string $serviceId,
        public string $subject,
        public string $description,
        public ?string $location,
        public string $status,
        public array $steps,
        public array $allowedTransitions,
        public string $createdAt,
        public string $updatedAt,
        public bool $isPublic,
        public int $supportCount,
        /** @var list<string> F70 : champs retirés par l'API pour un agent non habilité */
        public array $maskedFields = [],
    ) {}

    /** F70 : le lieu d'une demande de contact peut être l'adresse personnelle de l'habitant. */
    public function withMaskedLocation(): self
    {
        if ($this->location === null || $this->location === '') {
            return $this;
        }

        return new self($this->id, $this->reference, $this->type, $this->serviceId, $this->subject, $this->description, null, $this->status,
            $this->steps, $this->allowedTransitions, $this->createdAt, $this->updatedAt, $this->isPublic, $this->supportCount, ['location']);
    }

    public static function fromRequest(ServiceRequest $request, int $supportCount = 0): self
    {
        return new self(
            $request->id,
            $request->reference,
            $request->type,
            $request->serviceId,
            $request->subject,
            $request->description,
            $request->location,
            $request->status(),
            $request->steps(),
            $request->allowedTransitions(),
            $request->createdAt->format(\DateTimeInterface::ATOM),
            $request->updatedAt()->format(\DateTimeInterface::ATOM),
            $request->isPublic(),
            $supportCount,
        );
    }
}
