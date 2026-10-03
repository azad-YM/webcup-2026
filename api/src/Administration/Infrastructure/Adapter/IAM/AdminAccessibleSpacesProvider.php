<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\IAM;

use Administration\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessHandler;
use Administration\Application\Query\GetMemberSpaceAccess\GetMemberSpaceAccessQuery;
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
