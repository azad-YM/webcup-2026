<?php

declare(strict_types=1);

namespace Communication\Application\Command\SavePublication;

use Symfony\Component\Validator\Constraints as Assert;

/** Creates (without id) or revises a publication, and sets its state. */
final readonly class SavePublicationCommand
{
    /** @param list<string> $body */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 80)] public string $category,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\Count(min: 1, max: 50)] public array $body,
        public bool $important = false,
        #[Assert\Choice(['draft', 'published', 'withdrawn'])] public string $state = 'draft',
        #[Assert\Length(max: 80)] public ?string $id = null,
    ) {}
}
