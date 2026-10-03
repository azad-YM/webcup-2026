<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** DTO contractuel du port `MunicipalServiceDirectory`. */
final readonly class MunicipalServiceSummary
{
    public function __construct(
        public string $id,
        public string $name,
        public string $place,
        public string $hours,
    ) {}
}
