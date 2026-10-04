<?php

declare(strict_types=1);

namespace Administration\Application\Command\SetMunicipalServiceAvailability;

use Symfony\Component\Validator\Constraints as Assert;

/** F63 : désactive (motif obligatoire) ou réactive immédiatement un service (`admin.service.disable`). */
final readonly class SetMunicipalServiceAvailabilityCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Regex('/^[a-z0-9][a-z0-9-]{0,79}$/')] public string $id = '',
        public bool $disabled = true,
        #[Assert\Length(max: 500)] public string $reason = '',
    ) {}
}
