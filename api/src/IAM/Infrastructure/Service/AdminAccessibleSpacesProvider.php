<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Service;

use IAM\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessHandler;
use IAM\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessQuery;
use IAM\Application\DTO\AccessibleSpace;
use IAM\Application\Ports\Provider\AccessibleSpacesProvider;

final readonly class AdminAccessibleSpacesProvider implements AccessibleSpacesProvider
{
    public function __construct(private GetMemberSpaceAccessHandler $getMemberSpaceAccess) {}

    public function findForUser(string $userId): array
    {
        $access = ($this->getMemberSpaceAccess)(new GetMemberSpaceAccessQuery($userId));
        if ($access === null) {
            return [];
        }

        return [new AccessibleSpace(
            code: 'admin',
            name: 'Administration',
            description: 'Gérez les comptes, les rôles et les modules de l’application.',
            roles: $access->roles,
        )];
    }
}
