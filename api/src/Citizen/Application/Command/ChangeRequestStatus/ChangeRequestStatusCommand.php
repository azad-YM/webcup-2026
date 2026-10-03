<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ChangeRequestStatus;

use Citizen\Domain\Entity\ServiceRequest;
use Symfony\Component\Validator\Constraints as Assert;

/** `expectedStatus` : statut vu par l'agent ; s'il a changé entre-temps, la commande est refusée (409). */
final readonly class ChangeRequestStatusCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ServiceRequest::STATUSES)]
        public string $status = '',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ServiceRequest::STATUSES)]
        public string $expectedStatus = '',
        #[Assert\Length(max: ServiceRequest::COMMENT_MAX)]
        public ?string $comment = null,
    ) {}
}
