<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ActivateMyCitizenAccount;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\CitizenProfile;
use Citizen\Domain\Entity\Citizen;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Un compte existant (par exemple un agent) devient citoyen sans nouvelle inscription.
 * Idempotent : un compte déjà citoyen retrouve son profil, sans doublon ni nouvel événement.
 */
#[AsMessageHandler]
final readonly class ActivateMyCitizenAccountHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    public function __invoke(ActivateMyCitizenAccountCommand $cmd): CitizenProfile
    {
        $userId = $this->identity->userId();
        $citizen = $this->citizens->findByUserId($userId);
        if ($citizen === null) {
            $citizen = Citizen::register($this->ids->getId(), $userId, $this->clock->now());
            $this->citizens->save($citizen);
        }

        return CitizenProfile::fromCitizen($citizen);
    }
}
