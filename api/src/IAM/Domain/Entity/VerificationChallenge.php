<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/**
 * F53 et reconfirmation (F55) : code à 6 chiffres envoyé par e-mail. Seules les empreintes sont stockées.
 * Valable 10 minutes, 5 essais, 3 envois au plus (1 + 2 renvois) espacés d'une minute.
 *
 * - `sign_in` : seconde étape d'une connexion ; porte la méthode et l'appareil de la première étape.
 *   L'identifiant public du défi n'est remis qu'au navigateur qui a franchi la première étape.
 * - `reconfirm` : confirmation d'identité d'un compte déjà connecté (activer ou désactiver la vérification,
 *   exporter ses données).
 */
class VerificationChallenge
{
    public const SIGN_IN = 'sign_in';
    public const RECONFIRM = 'reconfirm';
    public const LIFETIME = 600;
    public const MAX_ATTEMPTS = 5;
    public const MAX_SENDS = 3;
    public const RESEND_DELAY = 60;

    public const OK = 'ok';
    public const INVALID = 'invalid';
    public const EXPIRED = 'expired';
    public const LOCKED = 'locked';

    private int $attempts = 0;
    private int $sends = 1;

    public function __construct(
        public readonly string $idHash,
        public readonly string $userId,
        public readonly string $purpose,
        private string $codeHash,
        private int $lastSentAt,
        private int $expiresAt,
        public readonly ?string $method = null,
        public readonly ?string $deviceHash = null,
    ) {}

    /** Compare l'empreinte du code saisi ; compte l'essai manqué. */
    public function check(string $codeHash, int $now): string
    {
        if ($this->expiresAt <= $now) return self::EXPIRED;
        if ($this->attempts >= self::MAX_ATTEMPTS) return self::LOCKED;
        if (hash_equals($this->codeHash, $codeHash)) return self::OK;
        ++$this->attempts;

        return $this->attempts >= self::MAX_ATTEMPTS ? self::LOCKED : self::INVALID;
    }

    public function remainingAttempts(): int { return max(0, self::MAX_ATTEMPTS - $this->attempts); }

    /** Secondes à attendre avant un renvoi ; -1 si les envois sont épuisés, le défi expiré ou bloqué. */
    public function resendDelay(int $now): int
    {
        if ($this->sends >= self::MAX_SENDS || $this->expiresAt <= $now || $this->attempts >= self::MAX_ATTEMPTS) return -1;

        return max(0, $this->lastSentAt + self::RESEND_DELAY - $now);
    }

    /** Nouveau code : il remplace l'ancien et repart pour 10 minutes ; les essais déjà manqués restent comptés. */
    public function resend(string $codeHash, int $now): void
    {
        if ($this->resendDelay($now) !== 0) throw new \DomainException('The code cannot be sent again now.');
        $this->codeHash = $codeHash;
        $this->lastSentAt = $now;
        $this->expiresAt = $now + self::LIFETIME;
        ++$this->sends;
    }

    public function expiresAt(): int { return $this->expiresAt; }
    public function remainingSends(): int { return max(0, self::MAX_SENDS - $this->sends); }
}
