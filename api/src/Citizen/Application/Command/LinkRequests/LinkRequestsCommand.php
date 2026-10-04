<?php

declare(strict_types=1);

namespace Citizen\Application\Command\LinkRequests;

use Symfony\Component\Validator\Constraints as Assert;

/** F75 : lier des demandes en un même problème ; elles rejoignent le groupe de `requestId` (créé au besoin). */
final readonly class LinkRequestsCommand
{
    /** @param list<string> $otherIds */
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
        #[Assert\Count(min: 1, max: 50)]
        #[Assert\All([new Assert\Type('string'), new Assert\NotBlank()])]
        public array $otherIds = [],
    ) {}
}
