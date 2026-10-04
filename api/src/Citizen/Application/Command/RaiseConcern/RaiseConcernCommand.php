<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RaiseConcern;

use Citizen\Domain\Entity\Concern;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class RaiseConcernCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Choice(choices: Concern::TOPICS)]
        public string $topic = 'data',
        #[Assert\NotBlank]
        #[Assert\Length(max: Concern::SUBJECT_MAX)]
        public string $subject = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: Concern::MESSAGE_MAX)]
        public string $message = '',
    ) {}
}
