<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Domain\Entity\CitizenNotification;
use Citizen\Domain\Entity\RequestMessage;
use Citizen\Domain\Event\RequestMessagePosted;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

/** F84 : une réponse d'agent crée une notification persistée dans l'espace de l'habitant (sans doublon). */
final readonly class NotifyCitizenOfRequestMessage
{
    public function __construct(private MessageBusInterface $commandBus) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(RequestMessagePosted $event): void
    {
        if ($event->author !== RequestMessage::AUTHOR_AGENT) {
            return;
        }
        $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
            $event->citizenId,
            CitizenNotification::KIND_REQUEST_MESSAGE,
            sprintf('request-message:%s', $event->messageId),
            sprintf('Demande %s : la mairie vous a répondu', $event->reference),
            sprintf('Un agent a répondu à votre demande %s. Ouvrez la demande pour lire sa réponse et lui répondre si besoin.', $event->reference),
            '/espace/demandes?ref=' . rawurlencode($event->reference),
        ));
    }
}
