<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\SignInRecord;

/** F54/F55 : journal des connexions réussies d'un compte (90 jours). */
interface SignInRecordRepository
{
    /** Ajoute la connexion et purge les traces du compte plus anciennes que la durée de conservation. */
    public function add(SignInRecord $record): void;
    /** @return list<SignInRecord> les plus récentes d'abord */
    public function recentByUser(string $userId, int $limit): array;
}
