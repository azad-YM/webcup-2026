<?php

declare(strict_types=1);

namespace Administration\Application\Controller;

use Administration\Application\Command\CreateRole\CreateRoleCommand;
use Administration\Application\Query\ListRoles\ListRolesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class RoleController extends AppController
{
    #[Route('/api/administration/roles', name: 'list_admin_roles', methods: ['GET'], format: 'json')]
    public function list(): JsonResponse
    {
        return $this->dispatchQuery(new ListRolesQuery());
    }

    #[Route('/api/administration/roles', name: 'create_admin_role', methods: ['POST'], format: 'json')]
    public function create(#[MapRequestPayload] CreateRoleCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
