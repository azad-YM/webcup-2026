<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListConsultationContributions;

final readonly class ListConsultationContributionsQuery
{
    public function __construct(public string $consultationId) {}
}
