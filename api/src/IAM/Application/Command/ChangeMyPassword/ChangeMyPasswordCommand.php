<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeMyPassword;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ChangeMyPasswordCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\NotBlank, Assert\Length(max: 4096)]
        public string $currentPassword,
        #[\SensitiveParameter] #[Assert\NotBlank, Assert\Length(min: 8, max: 72)]
        public string $newPassword,
    ) {}
}
