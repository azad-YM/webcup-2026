<?php

declare(strict_types=1);

namespace Example\Application\Command\DeleteItem;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DeleteItemCommand
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 255)]
        public string $id,
    ) {}
}
