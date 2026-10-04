<?php

declare(strict_types=1);

namespace Participation\Application\Query\GetConsultation;

final readonly class GetConsultationQuery
{
    public function __construct(public string $id) {}
}
