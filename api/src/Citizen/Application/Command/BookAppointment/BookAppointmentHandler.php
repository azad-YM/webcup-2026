<?php

declare(strict_types=1);

namespace Citizen\Application\Command\BookAppointment;

use Citizen\Application\Exception\MunicipalServiceUnavailable;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Citizen\Domain\Entity\Appointment;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F39 : réserve un créneau libre pour le citoyen connecté (un créneau = un rendez-vous ; 409 s'il vient d'être pris). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class BookAppointmentHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private AppointmentRepository $appointments,
        private IIdProvider $ids,
        private IClock $clock,
        private ?MunicipalServiceDirectory $services = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(BookAppointmentCommand $cmd): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $slot = $this->appointments->findSlot($cmd->slotId) ?? throw new NotFoundException('Slot not found.');
        // F63 : aucune réservation sur un service désactivé (erreur contractuelle 409).
        if (($service = $this->services?->find($slot->serviceId)) !== null && $service->disabled) {
            throw MunicipalServiceUnavailable::for($service);
        }
        $now = $this->clock->now();
        $appointment = Appointment::book($this->ids->getId(), $citizen->id, $slot, $now);
        $slot->book($appointment->id, $now);
        $this->appointments->saveSlot($slot);
        $this->appointments->save($appointment);

        return AppointmentViews::appointment($appointment, $now);
    }
}
