<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\IAM;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\CityTime;
use Citizen\Domain\Entity\CitizenNotification;
use IAM\Application\Ports\Provider\AccountSecurityNotifier;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Port d'IAM implémenté par Citizen (F54) : la connexion depuis un nouvel appareil devient une notification de
 * l'espace citoyen, créée par le cas d'usage de Citizen. Un compte sans profil citoyen (agent) n'en reçoit pas.
 * La clé de source `device:{id}` rend l'appel idempotent.
 */
final readonly class CitizenAccountSecurityNotifier implements AccountSecurityNotifier
{
    public function __construct(private CitizenRepository $citizens, private MessageBusInterface $commandBus) {}

    public function newDeviceSignedIn(string $userId, string $deviceId, string $deviceLabel, \DateTimeImmutable $at): void
    {
        $citizen = $this->citizens->findByUserId($userId);
        if ($citizen === null) {
            return;
        }
        $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
            $citizen->id,
            CitizenNotification::KIND_SECURITY_NEW_DEVICE,
            'device:'.$deviceId,
            'Connexion depuis un nouvel appareil',
            sprintf('Votre compte a été utilisé le %s depuis « %s ». Si ce n’était pas vous, ouvrez « Sécurité du compte » et choisissez « Ce n’était pas moi ».', CityTime::describe($at), $deviceLabel),
            '/espace/securite',
        ));
    }

    public function unusualActivity(string $userId, string $sourceKey, string $message, \DateTimeImmutable $at): void
    {
        $citizen = $this->citizens->findByUserId($userId);
        if ($citizen === null) {
            return;
        }
        $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
            $citizen->id,
            CitizenNotification::KIND_SECURITY_UNUSUAL_ACTIVITY,
            'unusual:'.mb_substr($sourceKey, 0, 60),
            'Activité inhabituelle sur votre compte',
            $message,
            '/espace/securite',
        ));
    }
}
