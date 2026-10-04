<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

/** Contexte réseau de la requête en cours (adresse IP, navigateur), lu par l'infrastructure HTTP. */
interface ClientContext
{
    public function ip(): string;
    public function userAgent(): ?string;
}
