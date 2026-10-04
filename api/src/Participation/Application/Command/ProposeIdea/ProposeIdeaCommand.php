<?php

declare(strict_types=1);

namespace Participation\Application\Command\ProposeIdea;

use Symfony\Component\Validator\Constraints as Assert;

/** Idea of the connected citizen for the colony (F68); the district is optional. */
final readonly class ProposeIdeaCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 160)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 5000)] public string $description,
        #[Assert\Length(max: 40)] public ?string $district = null,
    ) {}
}
