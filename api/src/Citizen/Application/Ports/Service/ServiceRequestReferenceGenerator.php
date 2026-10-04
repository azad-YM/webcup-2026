<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Service;

interface ServiceRequestReferenceGenerator
{
    /** Référence lisible et unique, numérotée par année : `NT-2026-0042`. */
    public function next(\DateTimeImmutable $at): string;
}
