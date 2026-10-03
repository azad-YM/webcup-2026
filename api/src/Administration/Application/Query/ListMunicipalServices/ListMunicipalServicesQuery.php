<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListMunicipalServices;

/** Public catalogue: optional full-text search, theme filter and featured-only listing. */
final readonly class ListMunicipalServicesQuery
{
    public function __construct(
        public ?string $search = null,
        public ?string $category = null,
        public bool $featuredOnly = false,
    ) {}
}
