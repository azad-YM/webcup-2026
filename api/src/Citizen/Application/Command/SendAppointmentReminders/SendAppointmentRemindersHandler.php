<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SendAppointmentReminders;

use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Domain\CityTime;
use Citizen\Domain\Entity\Appointment;
use Citizen\Domain\Entity\CitizenNotification;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F40 : rappels des rendez-vous confirmés, la veille (moins de 24 h avant) et 2 h avant, chacun une seule fois.
 * Chaque rappel est une notification persistée de l'espace citoyen, poussée en temps réel (`notification.created`).
 * Idempotent : le rendez-vous mémorise ses rappels et la notification porte une `sourceKey` unique.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SendAppointmentRemindersHandler
{
    public function __construct(
        private AppointmentRepository $appointments,
        private CitizenNotificationRepository $notifications,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array{sent: int} */
    public function __invoke(SendAppointmentRemindersCommand $cmd): array
    {
        $now = $this->clock->now();
        $sent = 0;
        foreach ($this->appointments->findConfirmedBetween($now, $now->modify('+24 hours')) as $appointment) {
            $reminder = $appointment->dueReminder($now);
            if ($reminder === null) {
                continue;
            }
            $sourceKey = sprintf('appointment:%s:%s:%s', $appointment->id, $reminder, $appointment->startsAt()->getTimestamp());
            if (!$this->notifications->existsForSource($appointment->citizenId, $sourceKey)) {
                $this->notifications->save(CitizenNotification::notify(
                    $this->ids->getId(),
                    $appointment->citizenId,
                    CitizenNotification::KIND_APPOINTMENT_REMINDER,
                    $sourceKey,
                    sprintf('Rappel : rendez-vous %s', $appointment->reference),
                    self::message($appointment, $reminder),
                    '/espace/rendez-vous?id=' . rawurlencode($appointment->id),
                    $now,
                ));
                ++$sent;
            }
            $appointment->markReminded($reminder, $now);
            $this->appointments->save($appointment);
        }

        return ['sent' => $sent];
    }

    private static function message(Appointment $appointment, string $reminder): string
    {
        $message = sprintf(
            'Rappel : votre rendez-vous « %s » a lieu %s %s (%s), durée %d min, lieu : %s.',
            $appointment->serviceName(),
            $reminder === Appointment::REMINDER_TWO_HOURS ? 'bientôt, le' : 'le',
            CityTime::describe($appointment->startsAt()),
            CityTime::TIMEZONE_LABEL,
            $appointment->durationMinutes(),
            $appointment->location(),
        );
        if ($appointment->instructions() !== '') {
            $message .= ' À apporter : ' . $appointment->instructions();
        }

        return mb_substr($message, 0, 1000);
    }
}
