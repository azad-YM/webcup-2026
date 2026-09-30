<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Query\GetMyProfile\GetMyProfileQuery;
use IAM\Application\Query\ListMySpaces\ListMySpacesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class SpaceController extends AppController
{
    #[Route('/api/iam/me', methods: ['GET'], format: 'json')]
    public function profile(): JsonResponse
    {
        return $this->dispatchQuery(new GetMyProfileQuery());
    }

    #[Route('/api/iam/me/spaces', methods: ['GET'], format: 'json')]
    public function list(): JsonResponse
    {
        return $this->dispatchQuery(new ListMySpacesQuery());
    }
}
