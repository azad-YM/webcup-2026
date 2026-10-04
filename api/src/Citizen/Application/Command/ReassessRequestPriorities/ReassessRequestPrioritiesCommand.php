<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ReassessRequestPriorities;

/** F80 : réévaluation périodique des priorités automatiques (ancienneté, soutiens publics). */
final readonly class ReassessRequestPrioritiesCommand
{
    public function __construct(public int $limit = 1000) {}
}
