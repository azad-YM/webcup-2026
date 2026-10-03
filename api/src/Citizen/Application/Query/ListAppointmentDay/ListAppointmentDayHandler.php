<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListAppointmentDay;

use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Citizen\Domain\CityTime;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Créneaux d'une journée avec, pour chaque créneau réservé, le rendez-vous et le nom du citoyen (agents seulement). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListAppointmentDayHandler
{
    public function __construct(
        private RequestAccessPolicy $access,
        private AppointmentRepository $appointments,
        private CitizenRepository $citizens,
        private MunicipalServiceDirectory $services,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ListAppointmentDayQuery $query): array
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading appointments requires the admin.request.read permission.');
        }
        $now = $this->clock->now();
        $date = $query->date ?? CityTime::local($now)->format('Y-m-d');
        try {
            [$from, $to] = CityTime::day($date);
        } catch (\DomainException) {
            throw new DomainException('Invalid date (expected YYYY-MM-DD).');
        }
        $slots = $this->appointments->findSlotsBetween($from, $to);
        $booked = $this->appointments->findByIds(array_values(array_filter(array_map(fn ($slot) => $slot->appointmentId(), $slots))));
        $items = [];
        foreach ($slots as $slot) {
            $appointment = $slot->appointmentId() !== null ? ($booked[$slot->appointmentId()] ?? null) : null;
            $citizen = $appointment !== null ? $this->citizens->findById($appointment->citizenId) : null;
            $name = $citizen !== null ? trim(($citizen->firstName() ?? '') . ' ' . ($citizen->lastName() ?? '')) : '';
            $items[] = AppointmentViews::slot($slot) + ['appointment' => $appointment === null ? null : [
                'id' => $appointment->id,
                'reference' => $appointment->reference,
                'status' => $appointment->status(),
                'citizenName' => $name !== '' ? $name : 'Citoyen (nom non renseigné)',
                'citizenPhone' => $citizen?->phone(),
            ]];
        }

        return [
            'date' => $date,
            'timezone' => CityTime::TIMEZONE,
            'timezoneLabel' => CityTime::TIMEZONE_LABEL,
            'items' => $items,
            'bookedCount' => count(array_filter($items, fn (array $item) => $item['appointment'] !== null)),
            'canManage' => $canManage = $this->access->canProcessRequests(),
            // Choix du service à l'ouverture de créneaux (catalogue d'Administration via le port).
            'services' => $canManage ? array_map(fn ($service) => ['id' => $service->id, 'name' => $service->name, 'place' => $service->place], $this->services->all()) : [],
        ];
    }
}
