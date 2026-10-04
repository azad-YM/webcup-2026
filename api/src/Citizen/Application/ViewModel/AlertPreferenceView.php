<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

/** What the city may use to target alerts: the district of the profile and the health consent. */
final readonly class AlertPreferenceView
{
    public function __construct(
        public ?string $district,
        public bool $healthConsent,
    ) {}
}
