<?php
namespace Citizen\Application\Query\GetMyAlertPreference;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'query.bus')]
final readonly class GetMyAlertPreferenceHandler {
 public function __construct(private CitizenRepository $citizens,private AlertPreferenceRepository $preferences,private CurrentAccountProvider $identity) {}
 public function __invoke(GetMyAlertPreferenceQuery $query): array { $citizen=$this->citizens->findByUserId($this->identity->userId())??throw new NotFoundException('Compte citoyen introuvable.'); return ['citizenId'=>$citizen->id,'district'=>$citizen->district(),'healthConsent'=>$this->preferences->get($citizen->id)->healthConsent]; }
}
