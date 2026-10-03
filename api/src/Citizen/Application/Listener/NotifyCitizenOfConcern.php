<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Domain\Entity\CitizenNotification;
use Citizen\Domain\Entity\Concern;
use Citizen\Domain\Event\ConcernUpdated;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

/** F51 : le citoyen est prévenu dans son espace quand la mairie prend en compte son inquiétude ou y répond. */
final readonly class NotifyCitizenOfConcern
{
    public function __construct(private MessageBusInterface $commandBus) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(ConcernUpdated $event): void
    {
        $answered = $event->status === Concern::ANSWERED;
        $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
            $event->citizenId,
            CitizenNotification::KIND_CONCERN_UPDATED,
            sprintf('concern:%s:%s', $event->concernId, $event->status),
            sprintf('Inquiétude %s', $event->reference),
            $answered
                ? sprintf('La mairie a répondu à votre inquiétude %s.', $event->reference)
                : sprintf('Votre inquiétude %s est prise en compte par un agent.', $event->reference),
            '/espace/participation#' . $event->reference,
        ));
    }
}
