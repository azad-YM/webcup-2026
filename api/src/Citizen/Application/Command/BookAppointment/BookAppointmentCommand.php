<?php

declare(strict_types=1);

namespace Citizen\Application\Command\BookAppointment;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BookAppointmentCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $slotId = '',
    ) {}
}
