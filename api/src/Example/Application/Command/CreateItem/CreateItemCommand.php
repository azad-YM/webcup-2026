<?php

declare(strict_types=1);

namespace Example\Application\Command\CreateItem;

use Example\Domain\Entity\Item;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateItemCommand
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: Item::NAME_MAX_LENGTH, normalizer: 'trim')]
        public string $name,
        #[Assert\Length(max: Item::DESCRIPTION_MAX_LENGTH, normalizer: 'trim')]
        public string $description = '',
    ) {}
}
