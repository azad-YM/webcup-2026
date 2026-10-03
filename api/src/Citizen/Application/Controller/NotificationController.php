<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\MarkMyNotificationsRead\MarkMyNotificationsReadCommand;
use Citizen\Application\Query\ListMyNotifications\ListMyNotificationsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Centre de notifications de l'espace citoyen (F49, F40, F51). */
final class NotificationController extends AppController
{
    #[Route('/api/citizen/notifications', name: 'citizen_my_notifications', methods: ['GET'], format: 'json')]
    public function mine(): JsonResponse
    {
        return $this->dispatchQuery(new ListMyNotificationsQuery());
    }

    #[Route('/api/citizen/notifications/read', name: 'citizen_read_notifications', methods: ['POST'], format: 'json')]
    public function read(#[MapRequestPayload] MarkMyNotificationsReadCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
