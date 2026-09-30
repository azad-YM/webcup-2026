<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Query\ListPermissions\ListPermissionsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class PermissionController extends AppController
{
    #[Route('/api/iam/permissions', name: 'list_admin_permissions', methods: ['GET'], format: 'json')]
    public function list(): JsonResponse
    {
        return $this->dispatchQuery(new ListPermissionsQuery());
    }
}
