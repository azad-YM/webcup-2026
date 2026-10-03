<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyNotifications;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\CitizenNotificationView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyNotificationsHandler
{
    public const LIMIT = 50;

    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private CitizenNotificationRepository $notifications,
    ) {}

    /** @return array{items: list<CitizenNotificationView>, unreadCount: int} */
    public function __invoke(ListMyNotificationsQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');

        return [
            'items' => array_map(CitizenNotificationView::from(...), $this->notifications->findByCitizen($citizen->id, self::LIMIT)),
            'unreadCount' => $this->notifications->countUnread($citizen->id),
        ];
    }
}
