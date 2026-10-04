<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Identifiant du compte connecté ; seule source de l'identité du citoyen. */
interface CurrentAccountProvider
{
    public function userId(): string;
}
