<?php

declare(strict_types=1);

namespace Audit\Application\DTO\Security;

/**
 * F85 : information incohérente ou rafale d'envois constatée par un BC sur ses propres données.
 *
 * `key` identifie le cas de façon stable (ex. `request.closed_without_step|NT-2026-0042`) ;
 * `category` : `integrity` (données incohérentes) ou `abuse` (rafale d'envois) ;
 * `related` : identifiants et libellés **sans donnée personnelle** (référence de demande, nom de service…).
 */
final readonly class IntegrityIssue
{
    /** @param list<array{type: string, id: string, label: string}> $related */
    public function __construct(
        public string $key,
        public string $rule,
        public string $category,
        public string $severity,
        public string $title,
        public string $explanation,
        public array $related = [],
    ) {}
}
