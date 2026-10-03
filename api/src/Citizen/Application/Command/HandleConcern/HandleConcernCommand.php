<?php

declare(strict_types=1);

namespace Citizen\Application\Command\HandleConcern;

use Citizen\Domain\Entity\Concern;
use Symfony\Component\Validator\Constraints as Assert;

/** Agent : `in_review` (prise en compte, commentaire facultatif) ou `answered` (réponse obligatoire). */
final readonly class HandleConcernCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $concernId = '',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: [Concern::IN_REVIEW, Concern::ANSWERED])]
        public string $status = '',
        #[Assert\Length(max: Concern::RESPONSE_MAX)]
        public ?string $comment = null,
    ) {}
}
