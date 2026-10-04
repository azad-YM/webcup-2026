<?php

declare(strict_types=1);

namespace Participation\Application\Command\FollowIdea;

use Symfony\Component\Validator\Constraints as Assert;

/** An agent moves an idea forward; `comment` is required for `rejected` (reason). */
final readonly class FollowIdeaCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 36)] public string $ideaId,
        #[Assert\Choice(['in_review', 'accepted', 'rejected', 'done'])] public string $status,
        #[Assert\Length(max: 2000)] public ?string $comment = null,
    ) {}
}
