<?php

declare(strict_types=1);

namespace Participation\Application\Command\SaveConsultation;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Creates (without id) or revises a consultation (F65) or a call for opinions (F66), and sets its state.
 * Dates in ISO 8601; `options` (2 to 10 labels) only for the kind `consultation`.
 */
final readonly class SaveConsultationCommand
{
    /**
     * @param list<string> $description
     * @param list<string> $options
     */
    public function __construct(
        #[Assert\Choice(['opinion', 'consultation'])] public string $kind,
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $question,
        #[Assert\NotBlank] public string $opensAt,
        #[Assert\NotBlank] public string $closesAt,
        #[Assert\Count(max: 50)] public array $description = [],
        #[Assert\Count(max: 10)] public array $options = [],
        #[Assert\Length(max: 36)] public ?string $projectId = null,
        #[Assert\Choice(['draft', 'published', 'withdrawn'])] public string $state = 'draft',
        #[Assert\Length(max: 36)] public ?string $id = null,
    ) {}
}
