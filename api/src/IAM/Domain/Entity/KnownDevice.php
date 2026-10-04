<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

use IAM\Domain\Event\NewDeviceSignedIn;
use Shared\Domain\Model\AggregateRoot;

/**
 * F54 : appareil reconnu d'un compte. Le navigateur garde un identifiant aléatoire ; IAM n'en stocke que
 * l'empreinte SHA-256 (`deviceHash`). `trustedUntil` (F53) dispense du code e-mail pendant 30 jours au plus.
 */
class KnownDevice
{
    use AggregateRoot;

    public const TRUST_DAYS = 30;

    private ?\DateTimeImmutable $trustedUntil = null;

    private function __construct(
        public readonly string $id,
        public readonly string $userId,
        public readonly string $deviceHash,
        private string $label,
        public readonly \DateTimeImmutable $firstSeenAt,
        private \DateTimeImmutable $lastUsedAt,
    ) {}

    /** `$alert` : le compte connaissait déjà un autre appareil, la connexion doit être signalée. */
    public static function register(string $id, string $userId, string $deviceHash, string $label, \DateTimeImmutable $at, bool $alert): self
    {
        $device = new self($id, $userId, $deviceHash, mb_substr($label, 0, 80), $at, $at);
        if ($alert) {
            $device->record(new NewDeviceSignedIn($userId, $id, $device->label, $at->format(\DateTimeInterface::ATOM)));
        }

        return $device;
    }

    public function use(string $label, \DateTimeImmutable $at): void
    {
        $this->label = mb_substr($label, 0, 80);
        $this->lastUsedAt = $at;
    }

    public function trust(\DateTimeImmutable $at): void
    {
        $this->trustedUntil = $at->modify(sprintf('+%d days', self::TRUST_DAYS));
    }

    public function revokeTrust(): void { $this->trustedUntil = null; }

    public function isTrusted(\DateTimeImmutable $at): bool { return $this->trustedUntil !== null && $this->trustedUntil > $at; }

    public function label(): string { return $this->label; }
    public function lastUsedAt(): \DateTimeImmutable { return $this->lastUsedAt; }
    public function trustedUntil(): ?\DateTimeImmutable { return $this->trustedUntil; }
}
