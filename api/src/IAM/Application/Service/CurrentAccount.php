<?php

declare(strict_types=1);

namespace IAM\Application\Service;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use IAM\Domain\Entity\User;
use Shared\Domain\Exception\NotFoundException;

/** Compte connecté (identité issue du JWT vérifié, jamais du payload). */
final readonly class CurrentAccount
{
    public function __construct(private IAuthenticatedUserProvider $identity, private IUserRepository $users) {}

    public function user(): User
    {
        return $this->users->findById($this->identity->getUser()->getId()) ?? throw new NotFoundException('Account not found.');
    }
}
