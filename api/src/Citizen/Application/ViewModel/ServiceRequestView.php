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
    ) {}

    public static function fromRequest(ServiceRequest $request): self
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
        );
    }
}
