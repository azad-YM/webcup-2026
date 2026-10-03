<?php

declare(strict_types=1);

namespace Communication\Application\EventHandler;

use Communication\Application\RealtimeTopics;
use Communication\Domain\Event\AlertPublished;
use Communication\Domain\Event\AlertWithdrawn;
use Communication\Domain\Event\PublicationPublished;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Projects the domain events of Communication to realtime events (ADR 004).
 * The payload only says what changed (identifiers, severity, district): clients reload from the API.
 */
final readonly class ProjectCommunicationToRealtime
{
    public function __construct(private RealtimePublisher $publisher) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function alertPublished(AlertPublished $event): void
    {
        $this->publisher->publish(
            RealtimeTopics::forAlert($event->audience, $event->district),
            'alert.published',
            $this->alertPayload($event->alertId, $event->severity, $event->district),
        );
    }

    #[AsMessageHandler(bus: 'event.bus')]
    public function alertWithdrawn(AlertWithdrawn $event): void
    {
        $this->publisher->publish(
            RealtimeTopics::forAlert($event->audience, $event->district),
            'alert.withdrawn',
            $this->alertPayload($event->alertId, $event->severity, $event->district),
        );
    }

    #[AsMessageHandler(bus: 'event.bus')]
    public function publicationPublished(PublicationPublished $event): void
    {
        $this->publisher->publish(
            RealtimeTopics::PUBLIC_PUBLICATIONS,
            $event->important ? 'publication.important' : 'publication.published',
            ['id' => $event->publicationId, 'important' => $event->important],
        );
    }

    /** @return array<string, mixed> */
    private function alertPayload(string $id, string $severity, ?string $district): array
    {
        return ['id' => $id, 'severity' => $severity] + ($district === null ? [] : ['district' => $district]);
    }
}
