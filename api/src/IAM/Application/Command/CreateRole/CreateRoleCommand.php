<?php

namespace IAM\Application\Command\CreateRole;

use Symfony\Component\Validator\Constraints as Assert;

class CreateRoleCommand
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        public readonly string $name,
        #[Assert\All([
            new Assert\Collection(fields: [
                'context' => [new Assert\NotNull(), new Assert\Type('string')],
                'resource' => [new Assert\NotNull(), new Assert\Type('string')],
                'action' => [new Assert\NotNull(), new Assert\Type('string')],
            ]),
        ])]
        public readonly array $permissions,
    ) {}
}
