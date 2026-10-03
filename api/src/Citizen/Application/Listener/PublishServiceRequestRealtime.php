<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Domain\Event\ServiceRequestStatusChanged;
use Citizen\Domain\Event\ServiceRequestSubmitted;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Projection temps réel des demandes (ADR 004) : le citoyen auteur (`citizen.{citizenId}`) et les agents
 * (`administration.requests`) sont prévenus qu'une demande a changé. Le message ne porte que des identifiants
 * et le statut : les écrans relisent l'API.
 */
final readonly class PublishServiceRequestRealtime
{
    public const CITIZEN_TOPIC_PREFIX = 'citizen.';
    public const AGENTS_TOPIC = 'administration.requests';
    public const SUBMITTED = 'request.submitted';
    public const STATUS_CHANGED = 'request.status_changed';

    public function __construct(private RealtimePublisher $publisher) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function onSubmitted(ServiceRequestSubmitted $event): void
    {
        $this->publish($event->citizenId, self::SUBMITTED, [
            'requestId' => $event->requestId,
            'reference' => $event->reference,
            'status' => 'submitted',
        ]);
    }

    #[AsMessageHandler(bus: 'event.bus')]
    public function onStatusChanged(ServiceRequestStatusChanged $event): void
    {
        $this->publish($event->citizenId, self::STATUS_CHANGED, [
            'requestId' => $event->requestId,
            'reference' => $event->reference,
            'previousStatus' => $event->previousStatus,
            'status' => $event->status,
        ]);
    }

    /** @param array<string, string> $payload */
    private function publish(string $citizenId, string $type, array $payload): void
    {
        $this->publisher->publish(self::CITIZEN_TOPIC_PREFIX . $citizenId, $type, $payload);
        $this->publisher->publish(self::AGENTS_TOPIC, $type, $payload);
    }
}
