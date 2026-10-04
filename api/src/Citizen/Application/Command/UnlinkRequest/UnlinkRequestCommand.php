<?php

declare(strict_types=1);

namespace Citizen\Application\Command\UnlinkRequest;

use Symfony\Component\Validator\Constraints as Assert;

/** F75 : retirer une demande de son groupe « même problème ». */
final readonly class UnlinkRequestCommand
{
    public function __construct(
        #[Assert\NotBlank]
        public string $requestId = '',
    ) {}
}
