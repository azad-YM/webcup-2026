<?php

declare(strict_types=1);

namespace Participation\Application\Command\SetIdeaVisibility;

use Symfony\Component\Validator\Constraints as Assert;

/** Keeps an inappropriate idea off the public list (`public: false`, reason required) or puts it back. */
final readonly class SetIdeaVisibilityCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 36)] public string $ideaId,
        public bool $public,
        #[Assert\Length(max: 2000)] public ?string $reason = null,
    ) {}
}
