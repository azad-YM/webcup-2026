<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\ExportTrackingData;

use Symfony\Component\Validator\Constraints as Assert;

/** F88 : export (ou aperçu) d'un jeu de données de suivi. */
final class ExportTrackingDataCommand
{
    /** @param list<string> $columns */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 60)] public string $dataset = '',
        #[Assert\Date] public ?string $from = null,
        #[Assert\Date] public ?string $to = null,
        #[Assert\Length(max: 40)] public ?string $status = null,
        #[Assert\Count(min: 1, max: 40, minMessage: 'Choisissez au moins une colonne.')] #[Assert\All([new Assert\Type('string'), new Assert\Length(max: 60)])] public array $columns = [],
        #[Assert\Choice(['csv', 'json'])] public string $format = 'csv',
        /** Aperçu des premières lignes, sans fichier ni journalisation. */
        public bool $preview = false,
    ) {}
}
