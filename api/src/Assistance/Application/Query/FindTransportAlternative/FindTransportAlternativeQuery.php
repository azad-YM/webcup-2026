<?php

declare(strict_types=1);

namespace Assistance\Application\Query\FindTransportAlternative;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * F97 : l'habitant décrit son trajet en une phrase (« je dois aller du Port à l'hôpital ») ou choisit un départ et
 * une destination ; l'assistance propose la ligne à prendre ou la solution de remplacement. Rien n'est stocké.
 */
final readonly class FindTransportAlternativeQuery
{
    public function __construct(
        #[Assert\Length(max: 500)] public string $question = '',
        #[Assert\Length(max: 120)] public ?string $from = null,
        #[Assert\Length(max: 120)] public ?string $to = null,
        #[Assert\Choice(['fr', 'en', 'ar'])] public string $language = 'fr',
    ) {}
}
