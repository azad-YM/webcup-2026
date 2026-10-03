<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\CityTime;
use Citizen\Domain\Entity\Appointment;
use Citizen\Domain\Entity\AppointmentSlot;

/**
 * Vues des créneaux et rendez-vous (F39) : dates ISO 8601 **avec le décalage du fuseau de la ville**, fuseau nommé
 * (`timezone`, `timezoneLabel`) et phrase prête à afficher (`when`), pour une confirmation sans ambiguïté.
 */
final class AppointmentViews
{
    /** @return array<string, mixed> */
    public static function slot(AppointmentSlot $slot): array
    {
        return [
            'id' => $slot->id,
            'serviceId' => $slot->serviceId,
            'serviceName' => $slot->serviceName,
            'startsAt' => CityTime::local($slot->startsAt)->format(DATE_ATOM),
            'endsAt' => CityTime::local($slot->endsAt())->format(DATE_ATOM),
            'durationMinutes' => $slot->durationMinutes,
            'location' => $slot->location,
            'instructions' => $slot->instructions,
            'timezone' => CityTime::TIMEZONE,
            'timezoneLabel' => CityTime::TIMEZONE_LABEL,
            'when' => CityTime::describe($slot->startsAt),
            'booked' => $slot->isBooked(),
        ];
    }

    /** @return array<string, mixed> */
    public static function appointment(Appointment $appointment, \DateTimeImmutable $now): array
    {
        return [
            'id' => $appointment->id,
            'reference' => $appointment->reference,
            'status' => $appointment->status(),
            'serviceId' => $appointment->serviceId(),
            'serviceName' => $appointment->serviceName(),
            'startsAt' => CityTime::local($appointment->startsAt())->format(DATE_ATOM),
            'endsAt' => CityTime::local($appointment->endsAt())->format(DATE_ATOM),
            'durationMinutes' => $appointment->durationMinutes(),
            'location' => $appointment->location(),
            'instructions' => $appointment->instructions(),
            'timezone' => CityTime::TIMEZONE,
            'timezoneLabel' => CityTime::TIMEZONE_LABEL,
            'when' => CityTime::describe($appointment->startsAt()),
            'canChange' => $appointment->isChangeable($now),
            'createdAt' => $appointment->createdAt->format(DATE_ATOM),
            'updatedAt' => $appointment->updatedAt()->format(DATE_ATOM),
        ];
    }
}
