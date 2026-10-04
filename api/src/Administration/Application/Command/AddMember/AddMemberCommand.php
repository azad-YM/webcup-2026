<?php

declare(strict_types=1);

namespace Administration\Application\Command\AddMember;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AddMemberCommand
{
    /** @param list<string> $roleIds */
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 255)]
        public string $name,
        #[Assert\NotBlank]
        #[Assert\Email]
        #[Assert\Length(max: 255)]
        public string $email,
        #[\SensitiveParameter]
        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 72)]
        public string $password,
        #[Assert\Count(min: 1)]
        #[Assert\Unique]
        #[Assert\All([new Assert\Type('string'), new Assert\NotBlank()])]
        public array $roleIds,
    ) {}

    public function __debugInfo(): array
    {
        return ['name' => $this->name, 'email' => $this->email, 'roleIds' => $this->roleIds, 'password' => '[redacted]'];
    }
}
