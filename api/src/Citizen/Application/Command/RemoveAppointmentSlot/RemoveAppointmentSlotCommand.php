<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RemoveAppointmentSlot;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RemoveAppointmentSlotCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $slotId = '',
    ) {}
}
