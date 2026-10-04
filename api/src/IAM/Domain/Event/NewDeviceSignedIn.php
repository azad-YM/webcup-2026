<?php

declare(strict_types=1);

namespace IAM\Domain\Event;

use Shared\Domain\Event\DomainEvent;

/** F54 : un compte qui connaissait déjà au moins un appareil vient de se connecter depuis un autre. */
final readonly class NewDeviceSignedIn implements DomainEvent
{
    public function __construct(
        public string $userId,
        public string $deviceId,
        public string $deviceLabel,
        public string $occurredAt,
    ) {}
}
