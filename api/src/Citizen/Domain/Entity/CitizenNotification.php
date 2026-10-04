<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\CitizenNotified;
use Shared\Domain\Model\AggregateRoot;

/**
 * Notification de l'espace citoyen (F49, F40, F51) : un message clair, daté, avec un lien vers l'élément concerné.
 * Elle reste consultable après coup et se marque comme lue. `sourceKey` évite un doublon lorsqu'un même fait
 * est traité deux fois (redélivrance d'un événement, rappel relancé par le cron).
 */
class CitizenNotification
{
    use AggregateRoot;

    public const KIND_REQUEST_STATUS = 'request.status_changed';
    public const KIND_APPOINTMENT_REMINDER = 'appointment.reminder';
    public const KIND_CONCERN_UPDATED = 'concern.updated';
    /** F54 : connexion au compte depuis un nouvel appareil (fait signalé par IAM). */
    public const KIND_SECURITY_NEW_DEVICE = 'security.new_device';
    public const KINDS = [self::KIND_REQUEST_STATUS, self::KIND_APPOINTMENT_REMINDER, self::KIND_CONCERN_UPDATED, self::KIND_SECURITY_NEW_DEVICE];

    private ?\DateTimeImmutable $readAt = null;

    private function __construct(
        public readonly string $id,
        public readonly string $citizenId,
        public readonly string $kind,
        public readonly string $sourceKey,
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $link,
        public readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function notify(
        string $id,
        string $citizenId,
        string $kind,
        string $sourceKey,
        string $title,
        string $message,
        ?string $link,
        \DateTimeImmutable $at,
    ): self {
        if (!in_array($kind, self::KINDS, true)) {
            throw new \DomainException('Unknown notification kind.');
        }
        $notification = new self($id, $citizenId, $kind, mb_substr($sourceKey, 0, 120), mb_substr($title, 0, 160), mb_substr($message, 0, 1000), $link, $at);
        $notification->record(new CitizenNotified($id, $citizenId, $kind));

        return $notification;
    }

    public function markRead(\DateTimeImmutable $at): void
    {
        $this->readAt ??= $at;
    }

    public function readAt(): ?\DateTimeImmutable { return $this->readAt; }
}
