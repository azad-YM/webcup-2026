<?php

declare(strict_types=1);

namespace Participation\Application\Command\RecordConsultationOutcome;

use Symfony\Component\Validator\Constraints as Assert;

/** « Ce que la ville en a retenu » : paragraphs written by the agents after the closure (empty list removes it). */
final readonly class RecordConsultationOutcomeCommand
{
    /** @param list<string> $outcome */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 36)] public string $consultationId,
        #[Assert\Count(max: 50)] public array $outcome = [],
    ) {}
}
