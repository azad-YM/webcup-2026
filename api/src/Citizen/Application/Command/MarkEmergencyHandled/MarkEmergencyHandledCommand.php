<?php

declare(strict_types=1);

namespace Citizen\Application\Command\MarkEmergencyHandled;

use Symfony\Component\Validator\Constraints as Assert;

/** F86 : « Prise en charge » horodatée d'une urgence médicale. */
final readonly class MarkEmergencyHandledCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
    ) {}
}
