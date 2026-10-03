<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\CitizenNotification;

final readonly class CitizenNotificationView
{
    public function __construct(
        public string $id,
        public string $kind,
        public string $title,
        public string $message,
        public ?string $link,
        public string $createdAt,
        public ?string $readAt,
    ) {}

    public static function from(CitizenNotification $notification): self
    {
        return new self(
            $notification->id,
            $notification->kind,
            $notification->title,
            $notification->message,
            $notification->link,
            $notification->createdAt->format(\DateTimeInterface::ATOM),
            $notification->readAt()?->format(\DateTimeInterface::ATOM),
        );
    }
}
