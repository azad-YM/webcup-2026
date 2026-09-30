<?php

namespace IAM\Infrastructure\Security;

use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use IAM\Domain\Entity\User;
use Shared\Domain\Exception\NotFoundException;
use Shared\Domain\VO\AuthenticatedUser;
use Symfony\Bundle\SecurityBundle\Security;

class WebAuthenticatedUserProvider implements IAuthenticatedUserProvider
{
    public function __construct(private Security $security) {}

    public function getUser(): AuthenticatedUser
    {
        $user = $this->security->getUser();
        if (!($user instanceof User)) {
            throw new NotFoundException('User not found');
        }

        return new AuthenticatedUser($user->getId(), $user->getUserIdentifier());
    }
}
