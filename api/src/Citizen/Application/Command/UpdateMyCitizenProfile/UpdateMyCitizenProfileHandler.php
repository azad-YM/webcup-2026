<?php

declare(strict_types=1);

namespace Citizen\Application\Command\UpdateMyCitizenProfile;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\DistrictDirectory;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\CitizenProfile;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class UpdateMyCitizenProfileHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private DistrictDirectory $districts,
    ) {}

    public function __invoke(UpdateMyCitizenProfileCommand $cmd): CitizenProfile
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $district = $cmd->district === null ? null : trim($cmd->district);
        if ($district !== null && $district !== '' && !$this->districts->exists($district)) {
            throw new DomainException('Quartier inconnu : choisissez un quartier de la liste.');
        }
        $citizen->updateProfile($cmd->firstName, $cmd->lastName, $cmd->phone, $cmd->address, $cmd->district, $cmd->preferredLanguage);
        $this->citizens->save($citizen);

        return CitizenProfile::fromCitizen($citizen);
    }
}
