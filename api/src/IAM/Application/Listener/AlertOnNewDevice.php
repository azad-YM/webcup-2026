<?php

declare(strict_types=1);

namespace IAM\Application\Listener;

use IAM\Application\Ports\Provider\AccountSecurityNotifier;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\AccountMailer;
use IAM\Domain\Event\NewDeviceSignedIn;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F54 : une connexion depuis un nouvel appareil est signalée par e-mail (si le compte a une adresse) et dans
 * l'espace citoyen, via le port `AccountSecurityNotifier` implémenté par Citizen. Exécuté par le worker (async).
 */
final readonly class AlertOnNewDevice
{
    public function __construct(private IUserRepository $users, private AccountMailer $mailer, private AccountSecurityNotifier $notifier) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(NewDeviceSignedIn $event): void
    {
        $user = $this->users->findById($event->userId);
        if ($user === null || $user->status() === 'deleted') {
            return;
        }
        $at = new \DateTimeImmutable($event->occurredAt);
        $email = $user->contactEmail();
        if ($email !== null) {
            $this->mailer->sendNewDeviceAlert($email, $event->deviceLabel, $at);
        }
        $this->notifier->newDeviceSignedIn($event->userId, $event->deviceId, $event->deviceLabel, $at);
    }
}
