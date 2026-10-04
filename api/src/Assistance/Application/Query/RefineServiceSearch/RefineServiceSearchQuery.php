<?php

declare(strict_types=1);

namespace Assistance\Application\Query\RefineServiceSearch;

use Symfony\Component\Validator\Constraints as Assert;

/** D10 (IA) : la recherche locale, puis reformulation et reclassement par le modèle quand il est disponible. */
final readonly class RefineServiceSearchQuery
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 300)] public string $query,
        #[Assert\Choice(['fr', 'en', 'ar'])] public string $language = 'fr',
    ) {}
}
