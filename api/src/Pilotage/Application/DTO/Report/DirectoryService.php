<?php

declare(strict_types=1);

namespace Pilotage\Application\DTO\Report;

/** Contrat de `ServiceDirectory` (F98) : un service du catalogue, tel que Pilotage l'affiche. */
final readonly class DirectoryService
{
    public function __construct(
        public string $id,
        public string $name,
        public string $category,
        /** `available`, `maintenance` ou `incident`. */
        public string $status,
        public bool $disabled,
        /** Service d'urgence (hôpital, pompiers…) : joint par téléphone, pas par une demande en ligne. */
        public bool $emergency = false,
    ) {}
}
