<?php

declare(strict_types=1);

namespace Assistance\Application\Query\Explain;

use Symfony\Component\Validator\Constraints as Assert;

/** F90 : explication plus simple d'un passage d'une page publique, à la demande. Rien n'est stocké. */
final readonly class ExplainPassageQuery
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 2000)] public string $text,
        #[Assert\Choice(['fr', 'en', 'ar'])] public string $language = 'fr',
    ) {}
}
