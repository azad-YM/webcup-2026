<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RemoveAppointmentSlot;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Un créneau réservé n'est jamais retiré par un agent : le citoyen garde un rendez-vous confirmé (409). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class RemoveAppointmentSlotHandler
{
    public function __construct(private RequestAccessPolicy $access, private AppointmentRepository $appointments) {}

    /** @return array{removed: bool} */
    public function __invoke(RemoveAppointmentSlotCommand $cmd): array
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Managing appointment slots requires the admin.request.write permission.');
        }
        $slot = $this->appointments->findSlot($cmd->slotId) ?? throw new NotFoundException('Slot not found.');
        if ($slot->isBooked()) {
            throw new ConflitException('This slot is booked by a citizen and cannot be removed.');
        }
        $this->appointments->removeSlot($slot);

        return ['removed' => true];
    }
}
