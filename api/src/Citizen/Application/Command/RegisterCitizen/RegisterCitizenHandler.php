<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RegisterCitizen;

use Citizen\Application\Ports\Provider\CitizenAccountProvisioner;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Inscription publique : le compte IAM et le citoyen sont créés dans la même
 * transaction du command.bus. Le compte est citoyen immédiatement.
 */
#[AsMessageHandler]
final readonly class RegisterCitizenHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CitizenAccountProvisioner $accounts,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array{citizenId: string} */
    public function __invoke(#[\SensitiveParameter] RegisterCitizenCommand $cmd): array
    {
        $userId = $this->accounts->create($cmd->email, $cmd->password);
        $citizen = Citizen::register($this->ids->getId(), $userId, $this->clock->now());
        $this->citizens->save($citizen);

        return ['citizenId' => $citizen->id];
    }
}
