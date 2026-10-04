<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeGroupStatus;

use Citizen\Domain\Entity\ServiceRequest;
use Symfony\Component\Validator\Constraints as Assert;

/** F75 : traiter un groupe « même problème » en une action ; chaque demande qui le permet change d'état. */
final readonly class ChangeGroupStatusCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $groupId = '',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ServiceRequest::STATUSES)]
        public string $status = '',
        #[Assert\Length(max: ServiceRequest::COMMENT_MAX)]
        public ?string $comment = null,
    ) {}
}
