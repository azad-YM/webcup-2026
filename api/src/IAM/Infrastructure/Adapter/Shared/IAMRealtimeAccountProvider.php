<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Shared;

use IAM\Domain\Entity\User;
use Shared\Application\Ports\Provider\RealtimeAccountProvider;
use Symfony\Bundle\SecurityBundle\Security;

/** Port of the realtime stream implemented by IAM: identifier of the account authenticated by the JWT. */
final readonly class IAMRealtimeAccountProvider implements RealtimeAccountProvider
{
    public function __construct(private Security $security) {}

    public function currentUserId(): ?string
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user->getId() : null;
    }
}
