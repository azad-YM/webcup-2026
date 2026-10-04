<?php

declare(strict_types=1);

namespace IAM\Application\Command\VerifySignInCode;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VerifySignInCodeCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D')]
        public string $challengeId,
        #[\SensitiveParameter] #[Assert\Regex('/^[0-9]{6}$/D', message: 'Le code comporte 6 chiffres.')]
        public string $code,
        public bool $trustDevice = false,
    ) {}
}
