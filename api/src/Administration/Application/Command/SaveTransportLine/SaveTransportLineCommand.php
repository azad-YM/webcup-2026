<?php

declare(strict_types=1);

namespace Administration\Application\Command\SaveTransportLine;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * F97 : crée ou remplace une ligne de transport (identifiant fourni), avec son état et ses solutions de remplacement.
 * Dates en ISO 8601. `replacements` : `[{kind, label, details?, lineId?}]`.
 */
final readonly class SaveTransportLineCommand
{
    /**
     * @param list<string> $stops
     * @param list<string> $districts
     * @param list<array<string, mixed>> $replacements
     */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 40)] public string $id,
        #[Assert\NotBlank] #[Assert\Length(max: 10)] public string $code,
        #[Assert\NotBlank] #[Assert\Length(max: 160)] public string $name,
        #[Assert\Choice(['shuttle', 'tram', 'bus', 'cable', 'rover'])] public string $mode,
        #[Assert\Count(min: 2, max: 40)] public array $stops,
        #[Assert\Count(max: 6)] public array $districts = [],
        #[Assert\Length(max: 200)] public string $frequency = '',
        #[Assert\Choice(['normal', 'disrupted', 'interrupted'])] public string $status = 'normal',
        #[Assert\Length(max: 1000)] public string $statusMessage = '',
        public ?string $disruptedSince = null,
        public ?string $returnAt = null,
        #[Assert\Count(max: 6)] public array $replacements = [],
    ) {}
}
