<?php
namespace Citizen\Application\Command\SetMyAlertPreference;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'command.bus')]
final readonly class SetMyAlertPreferenceHandler {
 public function __construct(private CitizenRepository $citizens,private AlertPreferenceRepository $preferences,private CurrentAccountProvider $identity) {}
 public function __invoke(SetMyAlertPreferenceCommand $cmd): void { $citizen=$this->citizens->findByUserId($this->identity->userId())??throw new NotFoundException('Compte citoyen introuvable.'); $preference=$this->preferences->get($citizen->id); $preference->healthConsent=$cmd->healthConsent; $this->preferences->save($preference); }
}
