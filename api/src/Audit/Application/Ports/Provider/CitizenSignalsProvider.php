<?php

declare(strict_types=1);

namespace Audit\Application\Ports\Provider;

use Audit\Application\DTO\Security\IntegrityIssue;

/**
 * F85 : contrôles de cohérence et rafales d'envois sur les données des habitants. Implémenté par Citizen sur ses
 * propres tables (demandes, inquiétudes, rendez-vous), avec son propre port vers le catalogue des services.
 */
interface CitizenSignalsProvider
{
    /** @return list<IntegrityIssue> incohérences actuelles (demande close sans étape, rendez-vous sur service désactivé, références en double…) */
    public function integrityIssues(\DateTimeImmutable $now): array;

    /** @return list<IntegrityIssue> habitants ayant envoyé au moins `$threshold` demandes ou inquiétudes depuis `$since` */
    public function submissionBursts(\DateTimeImmutable $since, int $threshold): array;

    /** @return list<string> identifiants de compte (IAM) des habitants suspendus */
    public function suspendedAccountIds(): array;
}
