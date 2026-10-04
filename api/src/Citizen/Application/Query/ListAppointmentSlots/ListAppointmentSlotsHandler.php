<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListAppointmentSlots;

use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Citizen\Domain\CityTime;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListAppointmentSlotsHandler
{
    public const SLOTS_LIMIT = 200;

    public function __construct(private AppointmentRepository $appointments, private IClock $clock, private ?MunicipalServiceDirectory $directory = null) {}

    /** @return array{services: list<array<string, mixed>>, slots: list<array<string, mixed>>, selectedAvailability: ?array<string, mixed>, timezone: string, timezoneLabel: string} */
    public function __invoke(ListAppointmentSlotsQuery $query): array
    {
        $now = $this->clock->now();
        $services = [];
        foreach ($this->appointments->findOpenSlots(null, $now, 1000) as $slot) {
            $services[$slot->serviceId] ??= [
                'serviceId' => $slot->serviceId,
                'serviceName' => $slot->serviceName,
                'openSlots' => 0,
                'nextWhen' => CityTime::describe($slot->startsAt),
            ];
            ++$services[$slot->serviceId]['openSlots'];
        }
        // F64 : état de chaque service avant la démarche ; F63 : aucun créneau proposé pour un service désactivé.
        $availability = [];
        foreach (array_keys($services) as $serviceId) {
            $summary = $this->directory?->find((string) $serviceId);
            $availability[$serviceId] = $summary?->availability();
            $services[$serviceId]['availability'] = $availability[$serviceId];
        }
        $selected = $query->serviceId === null ? null
            : (array_key_exists($query->serviceId, $availability) ? $availability[$query->serviceId] : $this->directory?->find($query->serviceId)?->availability());
        $slots = $query->serviceId === null || ($selected['disabled'] ?? false) ? [] : $this->appointments->findOpenSlots($query->serviceId, $now, self::SLOTS_LIMIT);
        usort($services, fn (array $a, array $b) => strcmp((string) $a['serviceName'], (string) $b['serviceName']));

        return [
            'services' => array_values($services),
            'slots' => array_map(AppointmentViews::slot(...), $slots),
            'selectedAvailability' => $selected,
            'timezone' => CityTime::TIMEZONE,
            'timezoneLabel' => CityTime::TIMEZONE_LABEL,
        ];
    }
}
