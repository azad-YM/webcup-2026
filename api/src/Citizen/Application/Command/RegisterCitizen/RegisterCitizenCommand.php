<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RegisterCitizen;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RegisterCitizenCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        #[Assert\Length(max: 255)]
        public string $email,
        #[\SensitiveParameter]
        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 72, countUnit: Assert\Length::COUNT_BYTES)]
        public string $password,
    ) {}

    public function __debugInfo(): array
    {
        return ['email' => $this->email, 'password' => '[redacted]'];
    }
}
