<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SupportRequest;

use Symfony\Component\Validator\Constraints as Assert;

/** `support` vrai : soutenir ; faux : retirer son soutien. Idempotent dans les deux sens. */
final readonly class SupportRequestCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $requestId = '',
        public bool $support = true,
    ) {}
}
