<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\LoginLink;

/** D02 : liens de connexion à usage unique (empreintes seulement). */
interface LoginLinkRepository
{
    public function save(LoginLink $link): void;
    public function find(string $tokenHash): ?LoginLink;
    /** Suppression atomique ; false si le lien a déjà été consommé entre-temps. */
    public function consume(LoginLink $link): bool;
    public function countSince(string $userId, int $since): int;
}
