<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SetCitizenSuspension;

use Symfony\Component\Validator\Constraints as Assert;
final readonly class SetCitizenSuspensionCommand
{
    public function __construct(#[Assert\NotBlank] public string $citizenId, public bool $suspended) {}
}
