<?php

declare(strict_types=1);

namespace IAM\Application\Command\ConsumeLoginLink;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConsumeLoginLinkCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D', message: 'Lien de connexion invalide.')]
        public string $token,
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D', message: 'Secret de navigateur invalide.')]
        public string $browserSecret,
        #[Assert\Length(max: 128)]
        public ?string $deviceId = null,
    ) {}
}
