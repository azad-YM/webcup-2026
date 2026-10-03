<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Domain\Event\CitizenNotified;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Projection temps réel des notifications (ADR 004) : `notification.created` sur `citizen.{citizenId}`,
 * avec l'identifiant et le type seulement. Le centre de notifications relit l'API.
 */
final readonly class PublishCitizenNotificationRealtime
{
    public const CREATED = 'notification.created';

    public function __construct(private RealtimePublisher $publisher) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(CitizenNotified $event): void
    {
        $this->publisher->publish(PublishServiceRequestRealtime::CITIZEN_TOPIC_PREFIX . $event->citizenId, self::CREATED, [
            'notificationId' => $event->notificationId,
            'kind' => $event->kind,
        ]);
    }
}
