<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ReplyToRequest;

use Citizen\Domain\Entity\RequestMessage;
use Symfony\Component\Validator\Constraints as Assert;

/** F84 : réponse d'un agent, visible par l'habitant dans « Mes demandes ». */
final readonly class ReplyToRequestCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: RequestMessage::BODY_MAX)]
        public string $body = '',
    ) {}
}
