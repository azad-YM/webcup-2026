<?php

declare(strict_types=1);

namespace Communication\Application\DTO;

/** Audience of the connected citizen, provided by Citizen: district of the profile and health alerts consent. */
final readonly class Audience
{
    public function __construct(
        public ?string $district,
        public bool $healthConsent,
    ) {}
}
