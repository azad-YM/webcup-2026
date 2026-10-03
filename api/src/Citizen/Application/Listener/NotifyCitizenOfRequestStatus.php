<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Domain\Entity\CitizenNotification;
use Citizen\Domain\Event\ServiceRequestStatusChanged;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * F49 : quand une demande change d'état, le citoyen auteur reçoit une notification persistée dans son espace
 * (« Votre demande NT-… est passée à … »), retrouvable après coup. La création passe par le `command.bus`
 * (transaction) ; une redélivrance de l'événement ne crée pas de doublon (`sourceKey`).
 */
final readonly class NotifyCitizenOfRequestStatus
{
    /** Libellés vus par le citoyen, identiques à ceux du site. */
    public const STATUS_LABELS = [
        'submitted' => 'Envoyée',
        'acknowledged' => 'Prise en charge',
        'in_progress' => 'En cours de traitement',
        'resolved' => 'Résolue',
        'rejected' => 'Refusée',
    ];

    public function __construct(private MessageBusInterface $commandBus) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(ServiceRequestStatusChanged $event): void
    {
        $label = self::STATUS_LABELS[$event->status] ?? $event->status;
        $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
            $event->citizenId,
            CitizenNotification::KIND_REQUEST_STATUS,
            sprintf('request:%s:%s', $event->requestId, $event->status),
            sprintf('Demande %s : %s', $event->reference, mb_strtolower($label)),
            sprintf('Votre demande %s est passée à « %s ».%s', $event->reference, $label, match ($event->status) {
                'rejected' => ' Le motif est indiqué dans le détail de la demande.',
                'resolved' => ' Merci pour votre signalement.',
                default => '',
            }),
            '/espace/demandes?ref=' . rawurlencode($event->reference),
        ));
    }
}
