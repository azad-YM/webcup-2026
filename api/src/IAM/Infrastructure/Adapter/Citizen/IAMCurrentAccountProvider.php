<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Citizen;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;

/** Port de Citizen implémenté par IAM : identifiant du compte authentifié par le JWT. */
final readonly class IAMCurrentAccountProvider implements CurrentAccountProvider
{
    public function __construct(private IAuthenticatedUserProvider $identity) {}
    public function userId(): string { return $this->identity->getUser()->getId(); }
}
