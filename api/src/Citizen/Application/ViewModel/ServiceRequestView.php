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
        /** F80 : `urgent` | `high` | `normal` | `low`, motif et origine (`auto` règles, `agent`). */
        public string $priority = 'normal',
        public ?string $priorityReason = null,
        public string $prioritySource = 'auto',
        /** F79 : catégorie déduite du texte ; F86 : `medical_emergency`. */
        public string $category = 'other',
        public ?string $district = null,
        public bool $medicalEmergency = false,
        public ?string $emergencyHandledAt = null,
        /** F75 : groupe « même problème » (identifiant interne, agents seulement). */
        public ?string $groupId = null,
        /** F84 : nombre de messages échangés. */
        public int $messageCount = 0,
    ) {}

    /** F70 : le lieu d'une demande de contact peut être l'adresse personnelle de l'habitant. */
    public function withMaskedLocation(): self
    {
        if ($this->location === null || $this->location === '') {
            return $this;
        }

        return new self(...[...get_object_vars($this), 'location' => null, 'maskedFields' => ['location']]);
    }

    public function withMessageCount(int $count): self
    {
        return new self(...[...get_object_vars($this), 'messageCount' => $count]);
    }

    /** Vue de l'habitant : le groupe interne et l'origine de la priorité ne le concernent pas. */
    public function forCitizen(): self
    {
        return new self(...[...get_object_vars($this), 'groupId' => null, 'priorityReason' => null]);
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
            [],
            $request->priority(),
            $request->priorityReason(),
            $request->prioritySource(),
            $request->category(),
            $request->district(),
            $request->isMedicalEmergency(),
            $request->emergencyHandledAt()?->format(\DateTimeInterface::ATOM),
            $request->groupId(),
        );
    }
}
