<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

/**
 * Explicit, revocable consent of a citizen to receive health alerts and the recommendations
 * for vulnerable people (F31). No medical data is stored: only the consent itself.
 */
final class AlertPreference
{
    public function __construct(
        public readonly string $citizenId,
        private bool $healthConsent = false,
    ) {}

    public function healthConsent(): bool
    {
        return $this->healthConsent;
    }

    public function consentToHealthAlerts(bool $consent): void
    {
        $this->healthConsent = $consent;
    }
}
