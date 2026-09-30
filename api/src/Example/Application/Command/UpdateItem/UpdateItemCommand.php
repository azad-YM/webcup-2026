<?php

declare(strict_types=1);

namespace Example\Application\Command\UpdateItem;

use Example\Domain\Entity\Item;
use Example\Domain\Enum\ItemStatus;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class UpdateItemCommand
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 255)]
        public string $id,
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: Item::NAME_MAX_LENGTH, normalizer: 'trim')]
        public string $name,
        #[Assert\Length(max: Item::DESCRIPTION_MAX_LENGTH, normalizer: 'trim')]
        public string $description,
        #[Assert\Choice(callback: [ItemStatus::class, 'values'])]
        public string $status,
    ) {}
}
