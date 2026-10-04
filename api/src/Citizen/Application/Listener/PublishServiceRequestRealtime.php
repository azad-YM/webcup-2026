<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Domain\Event\RequestMessagePosted;
use Citizen\Domain\Event\ServiceRequestStatusChanged;
use Citizen\Domain\Event\ServiceRequestUpdated;
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
    /** F86 : alerte immédiate des agents (en plus de `request.submitted`). */
    public const MEDICAL_EMERGENCY = 'request.medical_emergency';
    /** F75/F80/F86 : priorité, groupe ou prise en charge d'une urgence (agents seulement). */
    public const UPDATED = 'request.updated';
    /** F84 : nouveau message dans le fil d'une demande. */
    public const MESSAGE_POSTED = 'request.message_posted';

    public function __construct(private RealtimePublisher $publisher) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function onSubmitted(ServiceRequestSubmitted $event): void
    {
        $this->publish($event->citizenId, self::SUBMITTED, [
            'requestId' => $event->requestId,
            'reference' => $event->reference,
            'status' => 'submitted',
        ]);
        if ($event->medicalEmergency) {
            $this->publisher->publish(self::AGENTS_TOPIC, self::MEDICAL_EMERGENCY, [
                'requestId' => $event->requestId,
                'reference' => $event->reference,
                'priority' => $event->priority,
            ]);
        }
    }

    #[AsMessageHandler(bus: 'event.bus')]
    public function onUpdated(ServiceRequestUpdated $event): void
    {
        $this->publisher->publish(self::AGENTS_TOPIC, self::UPDATED, [
            'requestId' => $event->requestId,
            'reference' => $event->reference,
            'change' => $event->change,
        ]);
    }

    #[AsMessageHandler(bus: 'event.bus')]
    public function onMessage(RequestMessagePosted $event): void
    {
        $this->publish($event->citizenId, self::MESSAGE_POSTED, [
            'requestId' => $event->requestId,
            'reference' => $event->reference,
            'author' => $event->author,
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
