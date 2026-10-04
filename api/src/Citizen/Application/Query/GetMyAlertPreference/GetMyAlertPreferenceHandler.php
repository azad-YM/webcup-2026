<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyAlertPreference;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AlertPreferenceView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyAlertPreferenceHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private AlertPreferenceRepository $preferences,
        private CurrentAccountProvider $identity,
    ) {}

    public function __invoke(GetMyAlertPreferenceQuery $query): AlertPreferenceView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');

        return new AlertPreferenceView($citizen->district(), $this->preferences->get($citizen->id)->healthConsent());
    }
}
