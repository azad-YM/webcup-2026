<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RecordCitizenNotification;

use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Domain\Entity\CitizenNotification;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class RecordCitizenNotificationHandler
{
    public function __construct(
        private CitizenNotificationRepository $notifications,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return string|null identifiant de la notification créée, null si elle existait déjà */
    public function __invoke(RecordCitizenNotificationCommand $cmd): ?string
    {
        if ($this->notifications->existsForSource($cmd->citizenId, $cmd->sourceKey)) {
            return null;
        }
        $notification = CitizenNotification::notify(
            $this->ids->getId(),
            $cmd->citizenId,
            $cmd->kind,
            $cmd->sourceKey,
            $cmd->title,
            $cmd->message,
            $cmd->link,
            $this->clock->now(),
        );
        $this->notifications->save($notification);

        return $notification->id;
    }
}
