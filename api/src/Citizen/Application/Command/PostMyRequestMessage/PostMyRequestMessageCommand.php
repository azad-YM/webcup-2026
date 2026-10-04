<?php

declare(strict_types=1);

namespace Citizen\Application\Command\PostMyRequestMessage;

use Citizen\Domain\Entity\RequestMessage;
use Symfony\Component\Validator\Constraints as Assert;

/** F84 : réponse de l'habitant sur sa propre demande ; l'auteur vient du compte connecté. */
final readonly class PostMyRequestMessageCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 50)]
        public string $reference = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: RequestMessage::BODY_MAX)]
        public string $body = '',
    ) {}
}
