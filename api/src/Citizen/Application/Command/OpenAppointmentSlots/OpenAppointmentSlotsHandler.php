<?php

declare(strict_types=1);

namespace Citizen\Application\Command\OpenAppointmentSlots;

use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Citizen\Domain\CityTime;
use Citizen\Domain\Entity\AppointmentSlot;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class OpenAppointmentSlotsHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private MunicipalServiceDirectory $services,
        private AppointmentRepository $appointments,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(OpenAppointmentSlotsCommand $cmd): array
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Managing appointment slots requires the admin.request.write permission.');
        }
        $service = $this->services->find($cmd->serviceId) ?? throw new \DomainException('Unknown municipal service.');
        $location = trim($cmd->location ?? '') !== '' ? (string) $cmd->location : $service->place;
        $start = CityTime::parse($cmd->date, $cmd->startTime);
        $now = $this->clock->now();
        // Toutes les vérifications avant toute sauvegarde : un créneau invalide refuse toute la série.
        $slots = [];
        for ($index = 0; $index < $cmd->count; ++$index) {
            $slots[] = AppointmentSlot::open(
                $this->ids->getId(),
                $service->id,
                $service->name,
                $start->modify(sprintf('+%d minutes', $index * $cmd->durationMinutes)),
                $cmd->durationMinutes,
                $location,
                $cmd->instructions ?? '',
                $now,
            );
        }
        foreach ($slots as $slot) {
            $this->appointments->saveSlot($slot);
        }

        return ['items' => array_map(AppointmentViews::slot(...), $slots)];
    }
}
