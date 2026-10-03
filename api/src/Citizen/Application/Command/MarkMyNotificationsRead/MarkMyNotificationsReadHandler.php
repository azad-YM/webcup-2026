<?php

declare(strict_types=1);

namespace Citizen\Application\Command\MarkMyNotificationsRead;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class MarkMyNotificationsReadHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private CitizenNotificationRepository $notifications,
        private IClock $clock,
    ) {}

    /** @return array{read: int} */
    public function __invoke(MarkMyNotificationsReadCommand $cmd): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $now = $this->clock->now();
        // Seules les notifications du citoyen connecté sont lues : un identifiant étranger est ignoré.
        $unread = $this->notifications->findUnread($citizen->id, $cmd->ids === [] ? null : array_values($cmd->ids));
        foreach ($unread as $notification) {
            $notification->markRead($now);
            $this->notifications->save($notification);
        }

        return ['read' => count($unread)];
    }
}
