<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeMyAppointment;

use Citizen\Application\Exception\MunicipalServiceUnavailable;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F39 : le citoyen déplace ou annule son rendez-vous à venir ; l'ancien créneau redevient libre. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeMyAppointmentHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private AppointmentRepository $appointments,
        private IClock $clock,
        private ?MunicipalServiceDirectory $services = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ChangeMyAppointmentCommand $cmd): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $appointment = $this->appointments->find($cmd->appointmentId);
        if ($appointment === null || $appointment->citizenId !== $citizen->id) {
            throw new NotFoundException('Appointment not found.');
        }
        $now = $this->clock->now();
        $previous = $this->appointments->findSlot($appointment->slotId());
        $slotId = trim($cmd->slotId ?? '');
        if ($slotId === '') {
            $appointment->cancel($now);
        } else {
            $next = $this->appointments->findSlot($slotId) ?? throw new NotFoundException('Slot not found.');
            // F63 : déplacer vers un service désactivé est refusé ; annuler reste toujours possible.
            if (($service = $this->services?->find($next->serviceId)) !== null && $service->disabled) {
                throw MunicipalServiceUnavailable::for($service);
            }
            $appointment->reschedule($next, $now);
            $next->book($appointment->id, $now);
            $this->appointments->saveSlot($next);
        }
        if ($previous !== null && $previous->appointmentId() === $appointment->id) {
            $previous->release();
            $this->appointments->saveSlot($previous);
        }
        $this->appointments->save($appointment);

        return AppointmentViews::appointment($appointment, $now);
    }
}
