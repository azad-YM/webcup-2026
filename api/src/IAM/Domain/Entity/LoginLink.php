<?php

declare(strict_types=1);

namespace IAM\Domain\Entity;

/**
 * D02 : lien de connexion à usage unique. Seules les empreintes sont stockées : celle du jeton du lien
 * (`tokenHash`) et celle du secret gardé par le navigateur qui a fait la demande (`browserHash`).
 */
class LoginLink
{
    public const LIFETIME = 600;
    /** Au plus 3 liens envoyés par compte et par quart d'heure (les demandes suivantes reçoivent la même réponse). */
    public const MAX_PER_WINDOW = 3;
    public const WINDOW = 900;

    public function __construct(
        public readonly string $tokenHash,
        public readonly string $userId,
        public readonly string $browserHash,
        public readonly int $createdAt,
        public readonly int $expiresAt,
    ) {}

    public function isExpired(int $now): bool { return $this->expiresAt <= $now; }

    public function matchesBrowser(string $browserHash): bool { return hash_equals($this->browserHash, $browserHash); }
}
