<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Participation;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationHandler;
use Citizen\Domain\Entity\CitizenNotification;
use Participation\Application\DTO\CitizenNotice;
use Participation\Application\Ports\Provider\CitizenNotifier;

/**
 * Participation notifies the author of an idea (F68). The notification is recorded by Citizen's own use case,
 * in the transaction of the agent's command (kind `idea.updated`, deduplicated by `sourceKey`).
 */
final readonly class CitizenParticipationNotifier implements CitizenNotifier
{
    public function __construct(private RecordCitizenNotificationHandler $record) {}

    public function notify(CitizenNotice $notice): void
    {
        ($this->record)(new RecordCitizenNotificationCommand(
            $notice->citizenId,
            CitizenNotification::KIND_IDEA_UPDATED,
            $notice->sourceKey,
            $notice->title,
            $notice->message,
            $notice->link,
        ));
    }
}
