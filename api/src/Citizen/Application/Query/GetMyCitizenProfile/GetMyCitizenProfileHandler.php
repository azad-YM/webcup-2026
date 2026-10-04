<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyCitizenProfile;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\CitizenProfile;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyCitizenProfileHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
    ) {}

    public function __invoke(GetMyCitizenProfileQuery $query): CitizenProfile
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');

        return CitizenProfile::fromCitizen($citizen);
    }
}
