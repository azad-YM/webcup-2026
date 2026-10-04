<?php

declare(strict_types=1);

namespace Participation\Application\Command\SubmitContribution;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Answer of the connected citizen (F65, F66): `choice` (option id) for a consultation,
 * `rating` (positive, mixed, negative) and/or `comment` for a call for opinions. Sent again, it replaces the answer.
 */
final readonly class SubmitContributionCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 36)] public string $consultationId,
        #[Assert\Length(max: 20)] public ?string $choice = null,
        #[Assert\Length(max: 20)] public ?string $rating = null,
        #[Assert\Length(max: 3000)] public ?string $comment = null,
    ) {}
}
