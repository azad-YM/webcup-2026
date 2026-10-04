<?php

declare(strict_types=1);

namespace Communication\Application\Query\SuggestPublicationPlainLanguage;

use Symfony\Component\Validator\Constraints as Assert;

/** F89 : brouillon « En clair » d'une publication en cours de saisie (agent avec `admin.communication.write`). */
final readonly class SuggestPublicationPlainLanguageQuery
{
    /** @param list<string> $body */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\Count(max: 50)] public array $body = [],
    ) {}
}
