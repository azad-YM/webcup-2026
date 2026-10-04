<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

use Assistance\Application\Ports\Provider\CatalogService;

final readonly class ServiceMatch
{
    public function __construct(public CatalogService $service, public float $score) {}
}
