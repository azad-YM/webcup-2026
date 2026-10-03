<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeMyAppointment;

use Symfony\Component\Validator\Constraints as Assert;

/** `slotId` renseigné : déplacer le rendez-vous sur ce créneau ; `slotId` null : l'annuler. */
final readonly class ChangeMyAppointmentCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $appointmentId = '',
        #[Assert\Length(max: 36)]
        public ?string $slotId = null,
    ) {}
}
