<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Provider;

final readonly class PlainLanguageDraft
{
    public function __construct(
        public string $text,
        /** true : rédigé par le modèle de langage ; false : brouillon local (premières phrases, mots simplifiés). */
        public bool $fromModel,
    ) {}
}
