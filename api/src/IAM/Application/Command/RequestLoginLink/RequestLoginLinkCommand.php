<?php

declare(strict_types=1);

namespace IAM\Application\Command\RequestLoginLink;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RequestLoginLinkCommand
{
    public function __construct(
        #[Assert\NotBlank, Assert\Email, Assert\Length(max: 255)]
        public string $email,
    ) {}
}
