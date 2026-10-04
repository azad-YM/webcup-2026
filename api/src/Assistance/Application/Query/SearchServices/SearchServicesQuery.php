<?php

declare(strict_types=1);

namespace Assistance\Application\Query\SearchServices;

/** D10 : recherche tolérante (locale, sans modèle) dans le catalogue des services. Lecture publique. */
final readonly class SearchServicesQuery
{
    public function __construct(
        public string $query,
        public string $language = 'fr',
    ) {}
}
