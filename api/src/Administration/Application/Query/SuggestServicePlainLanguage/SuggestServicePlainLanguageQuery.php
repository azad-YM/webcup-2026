<?php

declare(strict_types=1);

namespace Administration\Application\Query\SuggestServicePlainLanguage;

use Symfony\Component\Validator\Constraints as Assert;

/** F89 : brouillon « En clair » à partir des textes en cours de saisie (agent avec `admin.service.write`). */
final readonly class SuggestServicePlainLanguageQuery
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $name,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\Length(max: 10000)] public string $description = '',
    ) {}
}
