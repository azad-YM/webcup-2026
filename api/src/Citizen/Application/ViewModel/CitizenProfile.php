<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\Citizen;

/** Vue `CitizenProfile` du contrat HTTP (voir doc/README.md). L'e-mail reste servi par IAM. */
final readonly class CitizenProfile
{
    public function __construct(
        public string $id,
        public ?string $firstName,
        public ?string $lastName,
        public ?string $phone,
        public ?string $address,
        public ?string $district,
        public ?string $preferredLanguage,
        public string $registeredAt,
        public bool $profileCompleted,
    ) {}

    /** F70 : vue des agents non habilités — téléphone et adresse retirés par l'API. */
    public function masked(): self
    {
        return new self($this->id, $this->firstName, $this->lastName, null, null, $this->district, $this->preferredLanguage, $this->registeredAt, $this->profileCompleted);
    }

    public static function fromCitizen(Citizen $citizen): self
    {
        return new self(
            $citizen->id,
            $citizen->firstName(),
            $citizen->lastName(),
            $citizen->phone(),
            $citizen->address(),
            $citizen->district(),
            $citizen->preferredLanguage(),
            $citizen->registeredAt->format(\DateTimeInterface::ATOM),
            $citizen->isProfileCompleted(),
        );
    }
}
