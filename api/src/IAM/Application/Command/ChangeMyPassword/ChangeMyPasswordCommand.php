<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeMyPassword;

use Symfony\Component\Validator\Constraints as Assert;

/** F71: the connected account replaces its secret (mandatory after a provisional access code). */
final readonly class ChangeMyPasswordCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\NotBlank] public string $currentPassword,
        #[\SensitiveParameter] #[Assert\NotBlank] #[Assert\Length(min: 8, max: 72, countUnit: Assert\Length::COUNT_BYTES)] public string $newPassword,
    ) {}

    public function __debugInfo(): array
    {
        return ['currentPassword' => '[redacted]', 'newPassword' => '[redacted]'];
    }
}
