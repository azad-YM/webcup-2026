<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyAppointments;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyAppointmentsHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private AppointmentRepository $appointments,
        private IClock $clock,
    ) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListMyAppointmentsQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $now = $this->clock->now();

        return ['items' => array_map(
            fn ($appointment) => AppointmentViews::appointment($appointment, $now),
            $this->appointments->findByCitizen($citizen->id),
        )];
    }
}
