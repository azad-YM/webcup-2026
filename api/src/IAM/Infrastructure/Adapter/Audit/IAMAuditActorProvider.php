<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Audit;

use Audit\Application\DTO\AuditActor;
use Audit\Application\Ports\Provider\AuditActorProvider;
use IAM\Domain\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;

/** Port of the Audit BC implemented by IAM: the account authenticated by the JWT, labelled by its name (else e-mail). */
final readonly class IAMAuditActorProvider implements AuditActorProvider
{
    public function __construct(private Security $security) {}

    public function current(): ?AuditActor
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return null;
        }
        $name = trim((string) $user->getName());

        return new AuditActor($user->getId(), $name !== '' ? $name : $user->getUserIdentifier());
    }
}
