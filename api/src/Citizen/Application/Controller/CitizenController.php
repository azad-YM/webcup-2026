<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\RegisterCitizen\RegisterCitizenCommand;
use Citizen\Application\Command\UpdateMyCitizenProfile\UpdateMyCitizenProfileCommand;
use Citizen\Application\Query\GetMyCitizenProfile\GetMyCitizenProfileQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class CitizenController extends AppController
{
    /** Route publique (security.yaml : PUBLIC_ACCESS pour POST uniquement). */
    #[Route('/api/citizen/register', name: 'citizen_register', methods: ['POST'], format: 'json')]
    public function register(#[MapRequestPayload] #[\SensitiveParameter] RegisterCitizenCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/me', name: 'citizen_my_profile', methods: ['GET'], format: 'json')]
    public function profile(): JsonResponse
    {
        return $this->dispatchQuery(new GetMyCitizenProfileQuery());
    }

    #[Route('/api/citizen/me', name: 'citizen_update_my_profile', methods: ['PUT'], format: 'json')]
    public function updateProfile(#[MapRequestPayload] UpdateMyCitizenProfileCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
