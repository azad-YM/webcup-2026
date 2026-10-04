<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\VerificationChallenge;

/** F53 : codes de vérification envoyés par e-mail (empreintes seulement). Un seul défi par compte et par usage. */
interface VerificationChallengeRepository
{
    public function save(VerificationChallenge $challenge): void;
    public function find(string $idHash): ?VerificationChallenge;
    public function findForUser(string $userId, string $purpose): ?VerificationChallenge;
    public function remove(VerificationChallenge $challenge): void;
}
