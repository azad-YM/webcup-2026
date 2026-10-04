<?php

declare(strict_types=1);

namespace IAM\Application\Command\SetEmailVerification;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * F53 : activer (code reçu par e-mail obligatoire, il prouve que l'adresse fonctionne) ou désactiver
 * (mot de passe ou code) la vérification supplémentaire.
 */
final readonly class SetEmailVerificationCommand
{
    public function __construct(
        public bool $enabled,
        #[\SensitiveParameter] #[Assert\Length(max: 4096)]
        public ?string $password = null,
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D')]
        public ?string $challengeId = null,
        #[\SensitiveParameter] #[Assert\Regex('/^[0-9]{6}$/D', message: 'Le code comporte 6 chiffres.')]
        public ?string $code = null,
    ) {}
}
