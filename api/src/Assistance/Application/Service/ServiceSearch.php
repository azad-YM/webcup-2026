<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

/** Résultat de la recherche tolérante : services classés et, si une faute a été corrigée, la proposition. */
final readonly class ServiceSearch
{
    /** @param list<ServiceMatch> $matches */
    public function __construct(public array $matches, public ?string $suggestion) {}

    public function topScore(): float
    {
        return $this->matches[0]->score ?? 0.0;
    }
}
