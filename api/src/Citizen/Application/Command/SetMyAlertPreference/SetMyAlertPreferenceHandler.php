<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SetMyAlertPreference;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AlertPreferenceView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** The identity always comes from the connected account, never from the payload. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetMyAlertPreferenceHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private AlertPreferenceRepository $preferences,
        private CurrentAccountProvider $identity,
    ) {}

    public function __invoke(SetMyAlertPreferenceCommand $cmd): AlertPreferenceView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $preference = $this->preferences->get($citizen->id);
        $preference->consentToHealthAlerts($cmd->healthConsent);
        $this->preferences->save($preference);

        return new AlertPreferenceView($citizen->district(), $preference->healthConsent());
    }
}
