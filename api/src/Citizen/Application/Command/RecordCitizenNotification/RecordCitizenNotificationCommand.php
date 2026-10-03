<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RecordCitizenNotification;

/**
 * Commande interne (aucune route) : envoyée par les listeners de Citizen (changement de statut d'une demande,
 * réponse à une inquiétude) et par les rappels de rendez-vous. Rejouée avec la même `sourceKey`, elle ne crée rien.
 */
final readonly class RecordCitizenNotificationCommand
{
    public function __construct(
        public string $citizenId,
        public string $kind,
        public string $sourceKey,
        public string $title,
        public string $message,
        public ?string $link = null,
    ) {}
}
