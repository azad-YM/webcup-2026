<?php

declare(strict_types=1);

namespace Citizen\Application\Command\DeleteMyCitizenAccount;

use Symfony\Component\Validator\Constraints as Assert;
final readonly class DeleteMyCitizenAccountCommand
{
    public function __construct(#[Assert\NotBlank] #[Assert\Length(max: 72)] #[\SensitiveParameter] public string $password) {}
}
