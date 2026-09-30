<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Service;

use IAM\Application\Ports\Provider\CurrentAccountProvider;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;

final readonly class IAMCurrentAccountProvider implements CurrentAccountProvider
{
    public function __construct(private IAuthenticatedUserProvider $identity) {}
    public function userId(): string { return $this->identity->getUser()->getId(); }
}
