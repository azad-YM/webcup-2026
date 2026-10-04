<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

/** Secrets aléatoires cryptographiques des liens de connexion et des codes de vérification (L15). */
interface SecretGenerator
{
    /** 64 caractères hexadécimaux (256 bits). */
    public function token(): string;
    /** Code à 6 chiffres, zéros initiaux compris. */
    public function code(): string;
}
