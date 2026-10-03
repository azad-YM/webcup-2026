<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Pilotage;

use IAM\Domain\Entity\User;
use Pilotage\Application\DTO\AgentIdentity;
use Pilotage\Application\Ports\Provider\CurrentAgentProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Bundle\SecurityBundle\Security;

/** Port of Pilotage implemented by IAM: the account authenticated by the JWT. */
final readonly class IAMPilotageCurrentAgent implements CurrentAgentProvider
{
    public function __construct(private Security $security) {}

    public function current(): AgentIdentity
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedException('Authentication required.');
        }
        $name = trim((string) $user->getName());

        return new AgentIdentity($user->getId(), $name !== '' ? $name : $user->getUserIdentifier());
    }
}
