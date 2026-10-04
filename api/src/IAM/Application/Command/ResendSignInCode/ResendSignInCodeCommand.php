<?php

declare(strict_types=1);

namespace IAM\Application\Command\ResendSignInCode;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ResendSignInCodeCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D')]
        public string $challengeId,
    ) {}
}
