<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Domain\Event\AppointmentChanged;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Projection temps réel des rendez-vous (ADR 004) : `appointment.changed` `{ appointmentId, status }` pour le
 * citoyen (`citizen.{id}`) et pour les agents qui suivent les demandes (`administration.requests`).
 */
final readonly class PublishAppointmentRealtime
{
    public const CHANGED = 'appointment.changed';

    public function __construct(private RealtimePublisher $publisher) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(AppointmentChanged $event): void
    {
        $payload = ['appointmentId' => $event->appointmentId, 'status' => $event->status];
        $this->publisher->publish(PublishServiceRequestRealtime::CITIZEN_TOPIC_PREFIX . $event->citizenId, self::CHANGED, $payload);
        $this->publisher->publish(PublishServiceRequestRealtime::AGENTS_TOPIC, self::CHANGED, $payload);
    }
}
