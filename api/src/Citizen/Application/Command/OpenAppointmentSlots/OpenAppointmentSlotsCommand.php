<?php

declare(strict_types=1);

namespace Citizen\Application\Command\OpenAppointmentSlots;

use Citizen\Domain\Entity\AppointmentSlot;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un agent ouvre `count` créneaux consécutifs d'un service, à partir de `date` + `startTime` (heure de la ville).
 * `location` vide : lieu d'accueil du service dans le catalogue d'Administration.
 */
final readonly class OpenAppointmentSlotsCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public string $serviceId = '',
        #[Assert\NotBlank]
        #[Assert\Date]
        public string $date = '',
        #[Assert\NotBlank]
        #[Assert\Regex('/^([01]\d|2[0-3]):[0-5]\d$/')]
        public string $startTime = '',
        #[Assert\Range(min: AppointmentSlot::DURATION_MIN, max: AppointmentSlot::DURATION_MAX)]
        public int $durationMinutes = 30,
        #[Assert\Range(min: 1, max: 20)]
        public int $count = 1,
        #[Assert\Length(max: AppointmentSlot::LOCATION_MAX)]
        public ?string $location = null,
        #[Assert\Length(max: AppointmentSlot::INSTRUCTIONS_MAX)]
        public ?string $instructions = null,
    ) {}
}
