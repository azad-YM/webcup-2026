<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Communication;

use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceHandler;
use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceQuery;
use Communication\Application\DTO\Audience;
use Communication\Application\Ports\Provider\AudienceProvider;
use Shared\Domain\Exception\NotFoundException;

/** Communication asks Citizen for the audience of the connected account (district, health consent). */
final readonly class CitizenAudienceProvider implements AudienceProvider
{
    public function __construct(private GetMyAlertPreferenceHandler $preferences) {}

    public function current(): ?Audience
    {
        try {
            $view = ($this->preferences)(new GetMyAlertPreferenceQuery());
        } catch (NotFoundException) {
            return null;
        }

        return new Audience($view->district, $view->healthConsent);
    }
}
