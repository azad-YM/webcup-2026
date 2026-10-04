<?php

declare(strict_types=1);

namespace Assistance\Application\Ports\Provider;

/** Vue contractuelle d'un service municipal pour l'assistance : textes publics seulement, aucune donnée personnelle. */
final readonly class CatalogService
{
    /**
     * @param list<string> $keywords
     * @param array<string, array{name: string, summary: string}> $translations langue (en, ar) => textes traduits
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $category,
        public string $summary,
        public array $keywords,
        /** available | maintenance | incident */
        public string $status,
        public bool $disabled,
        /** hospital | emergency | fire | police | pharmacy, ou null */
        public ?string $emergency,
        public string $place,
        public ?string $phone,
        public array $translations = [],
        /** F89 : version en langage clair validée par un agent (vide si absente). */
        public string $plainLanguage = '',
    ) {}

    /** Nom dans la langue de l'interface, le français faisant foi. */
    public function nameIn(string $language): string
    {
        $translated = $this->translations[$language]['name'] ?? '';

        return $translated !== '' ? $translated : $this->name;
    }
}
