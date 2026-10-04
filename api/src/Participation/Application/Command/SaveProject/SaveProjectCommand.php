<?php

declare(strict_types=1);

namespace Participation\Application\Command\SaveProject;

use Symfony\Component\Validator\Constraints as Assert;

/** Creates (without id) or revises a project of the city, and sets its publication state (F67). */
final readonly class SaveProjectCommand
{
    /**
     * @param list<string>                                    $description
     * @param list<array{label: string, date: string, done?: bool}> $steps
     */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\Count(min: 1, max: 50)] public array $description,
        #[Assert\Choice(['study', 'in_progress', 'done'])] public string $status,
        #[Assert\Count(max: 30)] public array $steps = [],
        #[Assert\Length(max: 500)] public ?string $nextStep = null,
        #[Assert\Length(max: 40)] public ?string $district = null,
        #[Assert\Choice(['draft', 'published', 'withdrawn'])] public string $state = 'draft',
        #[Assert\Length(max: 36)] public ?string $id = null,
    ) {}
}
