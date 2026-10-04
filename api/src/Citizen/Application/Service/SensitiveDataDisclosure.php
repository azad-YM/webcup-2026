<?php

declare(strict_types=1);

namespace Citizen\Application\Service;

use Citizen\Application\Ports\Provider\SensitiveDataAccessPolicy;
use Shared\Application\Ports\Service\AuditTrail;

/**
 * F70 : les données personnelles sensibles des habitants sont masquées **par l'API** dans les écrans des agents.
 * Un agent habilité les affiche explicitement (`?reveal=1`) ; chaque affichage effectif est inscrit au journal
 * des actions (`citizen.sensitive-data.viewed`, ADR 006). Sans habilitation, la demande d'affichage est ignorée :
 * les champs restent masqués et l'écran indique « Masqué — accès réservé ».
 */
final readonly class SensitiveDataDisclosure
{
    public function __construct(private SensitiveDataAccessPolicy $policy, private ?AuditTrail $audit = null) {}

    public function canReveal(): bool
    {
        return $this->policy->canRevealSensitiveData();
    }

    /**
     * @param string $screen  écran consulté (`citizen-accounts`, `appointment-day`, `request-queue`)
     * @param int    $records nombre de fiches dont des données sensibles ont été affichées
     */
    public function reveal(bool $requested, string $screen, int $records, ?string $targetId = null): bool
    {
        if (!$requested || !$this->canReveal()) {
            return false;
        }
        if ($records > 0) {
            $this->audit?->record(
                'citizen.sensitive-data.viewed',
                'citizen-sensitive-data',
                $targetId ?? $screen,
                sprintf('Données personnelles sensibles affichées (%s, %d fiche%s).', $screen, $records, $records > 1 ? 's' : ''),
                ['screen' => $screen, 'records' => $records],
            );
        }

        return true;
    }

    /** @return array{revealed: bool, canReveal: bool} */
    public function meta(bool $revealed): array
    {
        return ['revealed' => $revealed, 'canReveal' => $revealed || $this->canReveal()];
    }

    /** `jeanne.dupont@exemple.fr` → `j•••@exemple.fr` : l'agent reconnaît le compte sans lire l'adresse complète. */
    public static function maskEmail(?string $email): ?string
    {
        if ($email === null || !str_contains($email, '@')) {
            return $email === null ? null : '•••';
        }
        [$local, $domain] = explode('@', $email, 2);

        return mb_substr($local, 0, 1) . '•••@' . $domain;
    }
}
