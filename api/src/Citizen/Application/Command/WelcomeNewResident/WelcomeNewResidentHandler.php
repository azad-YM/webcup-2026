<?php

declare(strict_types=1);

namespace Citizen\Application\Command\WelcomeNewResident;

use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Provider\DistrictDirectory;
use Citizen\Application\Ports\Provider\ResidentAccountProvisioner;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F71: account created at the city reception (decision of ADR 010). The login account (IAM) and the
 * citizen with their profile are created in the same transaction of the command bus. The provisional
 * access code is returned once for the printed sheet; it is neither stored in clear nor journaled.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class WelcomeNewResidentHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private ResidentAccountProvisioner $accounts,
        private CitizenAccountAccessPolicy $access,
        private DistrictDirectory $districts,
        private IIdProvider $ids,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(WelcomeNewResidentCommand $cmd): array
    {
        if (!$this->access->canManageAccounts()) {
            throw new AccessDeniedException('Permission de gestion des comptes citoyens requise.');
        }
        $district = $cmd->district !== null && trim($cmd->district) !== '' ? trim($cmd->district) : null;
        if ($district !== null && !$this->districts->exists($district)) {
            throw new DomainException('Quartier inconnu.');
        }
        $email = $cmd->email !== null && trim($cmd->email) !== '' ? trim($cmd->email) : null;
        $credentials = $this->accounts->createResidentAccount(trim($cmd->firstName.' '.$cmd->lastName), $email);

        $citizen = Citizen::register($this->ids->getId(), $credentials->userId, $this->clock->now());
        $citizen->updateProfile($cmd->firstName, $cmd->lastName, $cmd->phone, null, $district, $cmd->preferredLanguage);
        $this->citizens->save($citizen);

        $this->audit?->record(
            'citizen.account.welcomed',
            'citizen-account',
            $citizen->id,
            sprintf('Compte d’habitant %s créé à l’accueil (%s).', $credentials->residentId, $email === null ? 'sans e-mail' : 'avec e-mail'),
            ['residentId' => $credentials->residentId, 'language' => $cmd->preferredLanguage, 'withEmail' => $email !== null],
        );

        return [
            'citizenId' => $citizen->id,
            'residentId' => $credentials->residentId,
            'accessCode' => $credentials->accessCode,
            'firstName' => $citizen->firstName(),
            'lastName' => $citizen->lastName(),
            'preferredLanguage' => $cmd->preferredLanguage,
            'email' => $email,
        ];
    }
}
