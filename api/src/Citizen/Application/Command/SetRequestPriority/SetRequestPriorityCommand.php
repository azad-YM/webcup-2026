<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SetRequestPriority;

use Citizen\Domain\Entity\ServiceRequest;
use Citizen\Domain\Service\RequestTriage;
use Symfony\Component\Validator\Constraints as Assert;

/** F80 : un agent corrige la priorité proposée ; motif facultatif, journalisé. */
final readonly class SetRequestPriorityCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: RequestTriage::PRIORITIES)]
        public string $priority = '',
        #[Assert\Length(max: ServiceRequest::PRIORITY_REASON_MAX)]
        public ?string $reason = null,
    ) {}
}
